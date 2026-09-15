using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Rooms;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Mehfil.Infrastructure.Rooms;

public sealed class RoomService(
    MehfilDbContext db,
    RoomRegistry registry,
    IRoomNotifier notifier,
    IClock clock,
    ILogger<RoomService> logger) : IRoomService
{
    public const int OwnerSeatIndex = 5;
    public const int MessageMax = 500;
    public const int RecentMessages = 30;
    public const int MaxHistoryPage = 50;
    public const int AnnouncementMax = 500;
    private static readonly TimeSpan MessageInterval = TimeSpan.FromMilliseconds(700);

    // ---- Presence ---------------------------------------------------------

    public async Task<RoomStateDto> JoinAsync(string clubPublicId, long userId, string connectionId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        var now = clock.UtcNow;

        if (await db.ClubBans.AnyAsync(b => b.ClubId == club.Id && b.UserId == userId && (b.ExpiresAt == null || b.ExpiresAt > now), ct))
        {
            throw new ForbiddenException("room.banned", "You are banned from this club.");
        }

        // Moving rooms: evict from the previous one first so counts and seats stay consistent.
        var previousRoom = registry.GetUserRoom(userId);
        if (previousRoom is not null && previousRoom != club.Id)
        {
            await RemoveUserFromRoomAsync(previousRoom.Value, userId, RoomRemovalReasons.MovedRooms, ct);
        }

        var join = registry.AddConnection(club.Id, userId, connectionId, now);
        await notifier.AddToRoomAsync(club.Id, connectionId);

        if (join.IsFirstConnection)
        {
            var member = await db.ClubMembers.FirstOrDefaultAsync(m => m.ClubId == club.Id && m.UserId == userId, ct);
            if (member is null)
            {
                db.ClubMembers.Add(new ClubMember { ClubId = club.Id, UserId = userId, Role = ClubRole.Member, JoinedAt = now, LastActiveAt = now });
                club.MemberCount++;
            }
            else
            {
                member.LastActiveAt = now;
            }

            await UpsertVisitAsync(club.Id, userId, now, ct);
            club.OnlineCount = registry.Count(club.Id);
            await db.SaveChangesAsync(ct);

            var user = await BuildRoomUserAsync(club.Id, userId, ct);
            await notifier.UserJoinedAsync(club.Id, user, club.OnlineCount);

            if (club.OwnerId == userId)
            {
                var ownerSeat = await db.ClubSeats.FirstOrDefaultAsync(s => s.ClubId == club.Id && s.SeatIndex == OwnerSeatIndex, ct);
                if (ownerSeat is not null && ownerSeat.UserId is null)
                {
                    ownerSeat.UserId = userId;
                    ownerSeat.TakenAt = now;
                    ownerSeat.IsLocked = false;
                    await db.SaveChangesAsync(ct);
                    await notifier.SeatChangedAsync(club.Id, await BuildSeatAsync(club, ownerSeat, ct));
                }
            }

            logger.LogInformation("User {UserId} entered club {ClubId} ({Online} online)", userId, club.PublicId, club.OnlineCount);
        }

        return await BuildStateAsync(club, userId, ct);
    }

    public async Task LeaveConnectionAsync(string connectionId, CancellationToken ct)
    {
        var leave = registry.RemoveConnection(connectionId);
        if (leave is null)
        {
            return;
        }

        await notifier.RemoveFromRoomAsync(leave.ClubId, connectionId);
        if (leave.UserLeft)
        {
            await FinalizeUserLeftAsync(leave.ClubId, leave.UserId, leave.JoinedAt, ct);
        }
    }

    public async Task<RoomStateDto> GetStateAsync(string clubPublicId, long userId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        return await BuildStateAsync(club, userId, ct);
    }

    // ---- Chat -------------------------------------------------------------

    public async Task<ClubMessageDto> SendMessageAsync(long userId, string text, CancellationToken ct)
    {
        var clubId = registry.GetUserRoom(userId) ?? throw new BadRequestException("room.not_in_room", "Join a club room first.");
        var body = text.Trim();
        if (body.Length == 0 || body.Length > MessageMax)
        {
            throw new BadRequestException("room.invalid_message", $"Messages must be 1-{MessageMax} characters.");
        }

        if (!registry.TryMarkMessage(userId, clock.UtcNow, MessageInterval))
        {
            throw new BadRequestException("room.too_fast", "You are sending messages too quickly.");
        }

        var message = new ClubMessage { ClubId = clubId, SenderId = userId, Type = MessageType.Text, Text = body, CreatedAt = clock.UtcNow };
        db.ClubMessages.Add(message);
        await db.SaveChangesAsync(ct);

        var dto = new ClubMessageDto(message.Id, message.Type, message.Text, await BuildRoomUserAsync(clubId, userId, ct), message.CreatedAt, null);
        await notifier.MessageReceivedAsync(clubId, dto);
        return dto;
    }

    public async Task<IReadOnlyList<ClubMessageDto>> GetMessagesAsync(string clubPublicId, long? beforeId, int limit, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        var take = Math.Clamp(limit, 1, MaxHistoryPage);

        var query = db.ClubMessages.AsNoTracking().Where(m => m.ClubId == club.Id && !m.IsDeleted);
        if (beforeId is not null)
        {
            query = query.Where(m => m.Id < beforeId);
        }

        var rows = await query.OrderByDescending(m => m.Id).Take(take)
            .Select(m => new
            {
                m.Id, m.Type, m.Text, m.CreatedAt, m.GiftTransactionId,
                Sender = m.Sender == null ? null : new { m.Sender.Id, m.Sender.PublicId, m.Sender.DisplayName, m.Sender.AvatarUrl, m.Sender.Level, m.Sender.Gender, m.Sender.RoyalLevel },
            })
            .ToListAsync(ct);

        var senderIds = rows.Where(r => r.Sender != null).Select(r => r.Sender!.Id).Distinct().ToList();
        var roles = await db.ClubMembers.AsNoTracking()
            .Where(m => m.ClubId == club.Id && senderIds.Contains(m.UserId))
            .ToDictionaryAsync(m => m.UserId, m => m.Role, ct);

        return rows
            .OrderBy(r => r.Id)
            .Select(r => new ClubMessageDto(
                r.Id,
                r.Type,
                r.Text,
                r.Sender == null
                    ? null
                    : new RoomUserDto(r.Sender.PublicId, r.Sender.DisplayName, r.Sender.AvatarUrl, r.Sender.Level,
                        roles.GetValueOrDefault(r.Sender.Id, ClubRole.Member), r.Sender.Gender, r.Sender.RoyalLevel, false, false),
                r.CreatedAt,
                r.GiftTransactionId))
            .ToList();
    }

    public async Task DeleteMessageAsync(string clubPublicId, long messageId, long actorId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        var message = await db.ClubMessages.FirstOrDefaultAsync(m => m.Id == messageId && m.ClubId == club.Id, ct)
                      ?? throw NotFoundException.For("Message", messageId);

        if (message.SenderId != actorId)
        {
            await EnsureModeratorAsync(club, actorId, ct);
        }

        if (!message.IsDeleted)
        {
            message.IsDeleted = true;
            message.DeletedByUserId = actorId;
            await db.SaveChangesAsync(ct);
            await notifier.MessageDeletedAsync(club.Id, message.Id);
        }
    }

    public async Task SetAnnouncementAsync(string clubPublicId, long actorId, string? text, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        await EnsureModeratorAsync(club, actorId, ct);

        var value = text?.Trim();
        if (value is { Length: > AnnouncementMax })
        {
            throw new BadRequestException("room.invalid_announcement", $"Announcement must be at most {AnnouncementMax} characters.");
        }

        club.Announcement = string.IsNullOrEmpty(value) ? null : value;
        await db.SaveChangesAsync(ct);
        await notifier.AnnouncementChangedAsync(club.Id, club.Announcement);
    }

    // ---- Seats ------------------------------------------------------------

    public async Task<SeatDto> TakeSeatAsync(string clubPublicId, int index, long userId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        EnsureInRoom(club.Id, userId);
        ValidateIndex(index);

        if (index == OwnerSeatIndex && club.OwnerId != userId)
        {
            throw new ForbiddenException("room.owner_seat", "That seat is reserved for the club owner.");
        }

        var seat = await db.ClubSeats.FirstOrDefaultAsync(s => s.ClubId == club.Id && s.SeatIndex == index, ct)
                   ?? throw NotFoundException.For("Seat", index);
        if (seat.UserId == userId)
        {
            return await BuildSeatAsync(club, seat, ct);
        }

        if (seat.IsLocked)
        {
            throw new ConflictException("room.seat_locked", "That seat is locked.");
        }

        var now = clock.UtcNow;

        // Atomic claim: only succeeds if the seat is still free.
        var claimed = await db.ClubSeats
            .Where(s => s.ClubId == club.Id && s.SeatIndex == index && s.UserId == null && !s.IsLocked)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.UserId, userId).SetProperty(x => x.TakenAt, now).SetProperty(x => x.IsMuted, false), ct);
        if (claimed == 0)
        {
            throw new ConflictException("room.seat_taken", "Someone just took that seat.");
        }

        // Release any other seat the user held.
        var previous = await db.ClubSeats.FirstOrDefaultAsync(s => s.ClubId == club.Id && s.UserId == userId && s.SeatIndex != index, ct);
        if (previous is not null)
        {
            ClearSeat(previous);
            await db.SaveChangesAsync(ct);
            await notifier.SeatChangedAsync(club.Id, await BuildSeatAsync(club, previous, ct));
        }

        var taken = await db.ClubSeats.AsNoTracking().FirstAsync(s => s.ClubId == club.Id && s.SeatIndex == index, ct);
        var dto = await BuildSeatAsync(club, taken, ct);
        await notifier.SeatChangedAsync(club.Id, dto);
        return dto;
    }

    public async Task<SeatDto?> LeaveSeatAsync(string clubPublicId, long userId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        var seat = await db.ClubSeats.FirstOrDefaultAsync(s => s.ClubId == club.Id && s.UserId == userId, ct);
        if (seat is null)
        {
            return null;
        }

        ClearSeat(seat);
        await db.SaveChangesAsync(ct);
        var dto = await BuildSeatAsync(club, seat, ct);
        await notifier.SeatChangedAsync(club.Id, dto);
        return dto;
    }

    public async Task<SeatDto> LockSeatAsync(string clubPublicId, int index, bool locked, long actorId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        await EnsureModeratorAsync(club, actorId, ct);
        ValidateIndex(index);
        if (index == OwnerSeatIndex)
        {
            throw new BadRequestException("room.owner_seat", "The owner seat cannot be locked.");
        }

        var seat = await db.ClubSeats.FirstOrDefaultAsync(s => s.ClubId == club.Id && s.SeatIndex == index, ct)
                   ?? throw NotFoundException.For("Seat", index);
        if (locked && seat.UserId is not null)
        {
            ClearSeat(seat); // locking evicts the occupant
        }

        seat.IsLocked = locked;
        await db.SaveChangesAsync(ct);
        var dto = await BuildSeatAsync(club, seat, ct);
        await notifier.SeatChangedAsync(club.Id, dto);
        return dto;
    }

    public async Task<SeatDto> MuteSeatAsync(string clubPublicId, int index, bool muted, long actorId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        await EnsureModeratorAsync(club, actorId, ct);
        ValidateIndex(index);

        var seat = await db.ClubSeats.FirstOrDefaultAsync(s => s.ClubId == club.Id && s.SeatIndex == index, ct)
                   ?? throw NotFoundException.For("Seat", index);
        if (seat.UserId == club.OwnerId && actorId != club.OwnerId)
        {
            throw new ForbiddenException("room.cannot_mute_owner", "Admins cannot mute the owner.");
        }

        seat.IsMuted = muted;
        await db.SaveChangesAsync(ct);

        if (muted && seat.UserId is not null)
        {
            var state = registry.SetMic(seat.UserId.Value, false);
            if (state is not null)
            {
                var publicId = await db.Users.Where(u => u.Id == seat.UserId).Select(u => u.PublicId).FirstAsync(ct);
                await notifier.UserStateChangedAsync(club.Id, publicId, false, false);
            }
        }

        var dto = await BuildSeatAsync(club, seat, ct);
        await notifier.SeatChangedAsync(club.Id, dto);
        return dto;
    }

    public async Task<SeatDto> KickFromSeatAsync(string clubPublicId, int index, long actorId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        await EnsureModeratorAsync(club, actorId, ct);
        ValidateIndex(index);

        var seat = await db.ClubSeats.FirstOrDefaultAsync(s => s.ClubId == club.Id && s.SeatIndex == index, ct)
                   ?? throw NotFoundException.For("Seat", index);
        if (seat.UserId == club.OwnerId)
        {
            throw new ForbiddenException("room.cannot_remove_owner", "The owner cannot be removed from their seat.");
        }

        ClearSeat(seat);
        await db.SaveChangesAsync(ct);
        var dto = await BuildSeatAsync(club, seat, ct);
        await notifier.SeatChangedAsync(club.Id, dto);
        return dto;
    }

    // ---- Moderation ------------------------------------------------------

    public async Task KickUserAsync(string clubPublicId, string userPublicId, long actorId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        var target = await ResolveModerationTargetAsync(club, userPublicId, actorId, ct);
        await RemoveUserFromRoomAsync(club.Id, target.Id, RoomRemovalReasons.Kicked, ct);
        logger.LogInformation("User {ActorId} kicked {UserId} from club {ClubId}", actorId, target.Id, club.PublicId);
    }

    public async Task<ClubBanDto> BanUserAsync(string clubPublicId, string userPublicId, string? reason, long actorId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        var target = await ResolveModerationTargetAsync(club, userPublicId, actorId, ct);

        var ban = await db.ClubBans.FirstOrDefaultAsync(b => b.ClubId == club.Id && b.UserId == target.Id, ct);
        if (ban is null)
        {
            ban = new ClubBan { ClubId = club.Id, UserId = target.Id, ByUserId = actorId, Reason = Truncate(reason, 256), CreatedAt = clock.UtcNow };
            db.ClubBans.Add(ban);
            await db.SaveChangesAsync(ct);
        }

        await RemoveUserFromRoomAsync(club.Id, target.Id, RoomRemovalReasons.Banned, ct);
        logger.LogInformation("User {ActorId} banned {UserId} from club {ClubId}", actorId, target.Id, club.PublicId);

        var actor = await db.Users.Where(u => u.Id == actorId).Select(u => u.PublicId).FirstAsync(ct);
        return new ClubBanDto(target.PublicId, target.DisplayName, target.AvatarUrl, actor, ban.Reason, ban.CreatedAt);
    }

    public async Task UnbanUserAsync(string clubPublicId, string userPublicId, long actorId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        await EnsureModeratorAsync(club, actorId, ct);
        var upper = userPublicId.Trim().ToUpperInvariant();
        await db.ClubBans.Where(b => b.ClubId == club.Id && b.User.PublicId == upper).ExecuteDeleteAsync(ct);
    }

    public async Task<IReadOnlyList<ClubBanDto>> ListBansAsync(string clubPublicId, long actorId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        await EnsureModeratorAsync(club, actorId, ct);
        return await db.ClubBans.AsNoTracking()
            .Where(b => b.ClubId == club.Id)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new ClubBanDto(b.User.PublicId, b.User.DisplayName, b.User.AvatarUrl, b.ByUser.PublicId, b.Reason, b.CreatedAt))
            .ToListAsync(ct);
    }

    // ---- Mic / speaking --------------------------------------------------

    public async Task SetMicAsync(long userId, bool enabled, CancellationToken ct)
    {
        var current = registry.GetUserRoom(userId) ?? throw new BadRequestException("room.not_in_room", "Join a club room first.");
        if (enabled)
        {
            var seat = await db.ClubSeats.AsNoTracking().FirstOrDefaultAsync(s => s.ClubId == current && s.UserId == userId, ct);
            if (seat is null)
            {
                throw new ForbiddenException("room.no_seat", "Take a seat to use the microphone.");
            }

            if (seat.IsMuted)
            {
                throw new ForbiddenException("room.seat_muted", "An admin muted your seat.");
            }
        }

        var state = registry.SetMic(userId, enabled);
        if (state is not null)
        {
            var publicId = await db.Users.Where(u => u.Id == userId).Select(u => u.PublicId).FirstAsync(ct);
            await notifier.UserStateChangedAsync(state.Value.ClubId, publicId, state.Value.MicEnabled, state.Value.IsSpeaking);
        }
    }

    public async Task SetSpeakingAsync(long userId, bool speaking, CancellationToken ct)
    {
        var state = registry.SetSpeaking(userId, speaking);
        if (state is null)
        {
            return;
        }

        var publicId = await db.Users.Where(u => u.Id == userId).Select(u => u.PublicId).FirstAsync(ct);
        await notifier.UserStateChangedAsync(state.Value.ClubId, publicId, state.Value.MicEnabled, state.Value.IsSpeaking);
    }

    // ---- Internals --------------------------------------------------------

    private async Task RemoveUserFromRoomAsync(long clubId, long userId, string reason, CancellationToken ct)
    {
        var removed = registry.RemoveUser(userId);
        if (removed is null || removed.Value.ClubId != clubId)
        {
            return;
        }

        await notifier.RemovedFromRoomAsync(clubId, removed.Value.Connections, reason);
        await FinalizeUserLeftAsync(clubId, userId, removed.Value.JoinedAt, ct);
    }

    private async Task FinalizeUserLeftAsync(long clubId, long userId, DateTimeOffset joinedAt, CancellationToken ct)
    {
        var club = await db.Clubs.FirstOrDefaultAsync(c => c.Id == clubId, ct);
        if (club is null)
        {
            return;
        }

        var seat = await db.ClubSeats.FirstOrDefaultAsync(s => s.ClubId == clubId && s.UserId == userId, ct);
        if (seat is not null)
        {
            ClearSeat(seat);
        }

        var seconds = Math.Max(0, (long)(clock.UtcNow - joinedAt).TotalSeconds);
        club.OnlineCount = registry.Count(clubId);
        club.ActiveSeconds += seconds;
        await db.SaveChangesAsync(ct);
        await db.Users.Where(u => u.Id == userId).ExecuteUpdateAsync(s => s.SetProperty(u => u.ActiveSeconds, u => u.ActiveSeconds + seconds), ct);

        var publicId = await db.Users.Where(u => u.Id == userId).Select(u => u.PublicId).FirstAsync(ct);
        if (seat is not null)
        {
            await notifier.SeatChangedAsync(clubId, await BuildSeatAsync(club, seat, ct));
        }

        await notifier.UserLeftAsync(clubId, publicId, club.OnlineCount);
    }

    private async Task<RoomStateDto> BuildStateAsync(Club club, long userId, CancellationToken ct)
    {
        var onlineIds = registry.GetUsers(club.Id);
        var seats = await db.ClubSeats.AsNoTracking().Where(s => s.ClubId == club.Id).OrderBy(s => s.SeatIndex).ToListAsync(ct);
        var seatedIds = seats.Where(s => s.UserId != null).Select(s => s.UserId!.Value);
        var userIds = onlineIds.Concat(seatedIds).Distinct().ToList();
        var users = await LoadRoomUsersAsync(club.Id, userIds, ct);

        var seatDtos = seats.Select(s => new SeatDto(
            s.SeatIndex,
            s.IsLocked,
            s.IsMuted,
            s.SeatIndex == OwnerSeatIndex,
            s.UserId is null ? null : users.GetValueOrDefault(s.UserId.Value))).ToList();

        var online = onlineIds.Select(id => users.GetValueOrDefault(id)).Where(u => u != null).Select(u => u!).ToList();
        var myRole = await db.ClubMembers.Where(m => m.ClubId == club.Id && m.UserId == userId).Select(m => (ClubRole?)m.Role).FirstOrDefaultAsync(ct);
        var mySeat = seats.FirstOrDefault(s => s.UserId == userId)?.SeatIndex;
        var isFollowing = await db.ClubFollows.AnyAsync(f => f.ClubId == club.Id && f.UserId == userId, ct);
        var owner = await db.Users.Where(u => u.Id == club.OwnerId).Select(u => u.PublicId).FirstAsync(ct);
        var recent = await GetMessagesAsync(club.PublicId, null, RecentMessages, ct);

        var roomClub = new RoomClubDto(club.PublicId, club.Name, club.CoverUrl, club.Level, club.Announcement, owner,
            club.JarHearts, club.JarTarget, club.JarResetsAt, club.JarsCollected, club.JarsForNextLevel, club.TotalHearts, club.FollowerCount, isFollowing);

        return new RoomStateDto(roomClub, myRole, mySeat, registry.Count(club.Id), seatDtos, online, recent);
    }

    private async Task<Dictionary<long, RoomUserDto>> LoadRoomUsersAsync(long clubId, IReadOnlyCollection<long> userIds, CancellationToken ct)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<long, RoomUserDto>();
        }

        var rows = await db.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id, u.PublicId, u.DisplayName, u.AvatarUrl, u.Level, u.Gender, u.RoyalLevel,
                Role = db.ClubMembers.Where(m => m.ClubId == clubId && m.UserId == u.Id).Select(m => (ClubRole?)m.Role).FirstOrDefault(),
            })
            .ToListAsync(ct);

        return rows.ToDictionary(r => r.Id, r =>
        {
            var (mic, speaking) = registry.GetState(r.Id);
            return new RoomUserDto(r.PublicId, r.DisplayName, r.AvatarUrl, r.Level, r.Role ?? ClubRole.Member, r.Gender, r.RoyalLevel, mic, speaking);
        });
    }

    private async Task<RoomUserDto> BuildRoomUserAsync(long clubId, long userId, CancellationToken ct)
    {
        var users = await LoadRoomUsersAsync(clubId, [userId], ct);
        return users.TryGetValue(userId, out var user) ? user : throw NotFoundException.For("User", userId);
    }

    private async Task<SeatDto> BuildSeatAsync(Club club, ClubSeat seat, CancellationToken ct)
    {
        RoomUserDto? user = null;
        if (seat.UserId is not null)
        {
            var users = await LoadRoomUsersAsync(club.Id, [seat.UserId.Value], ct);
            user = users.GetValueOrDefault(seat.UserId.Value);
        }

        return new SeatDto(seat.SeatIndex, seat.IsLocked, seat.IsMuted, seat.SeatIndex == OwnerSeatIndex, user);
    }

    private async Task<Club> LoadClubAsync(string publicId, CancellationToken ct) =>
        await db.Clubs.FirstOrDefaultAsync(c => c.PublicId == publicId.Trim() && c.IsActive, ct)
        ?? throw NotFoundException.For("Club", publicId);

    private async Task<User> ResolveModerationTargetAsync(Club club, string userPublicId, long actorId, CancellationToken ct)
    {
        var actorRole = await EnsureModeratorAsync(club, actorId, ct);
        var upper = userPublicId.Trim().ToUpperInvariant();
        var target = await db.Users.FirstOrDefaultAsync(u => u.PublicId == upper, ct) ?? throw NotFoundException.For("User", userPublicId);

        if (target.Id == club.OwnerId)
        {
            throw new ForbiddenException("room.cannot_remove_owner", "The owner cannot be removed.");
        }

        if (target.Id == actorId)
        {
            throw new BadRequestException("room.self", "You cannot do that to yourself.");
        }

        if (actorRole == ClubRole.Admin)
        {
            var targetRole = await db.ClubMembers.Where(m => m.ClubId == club.Id && m.UserId == target.Id).Select(m => (ClubRole?)m.Role).FirstOrDefaultAsync(ct);
            if (targetRole == ClubRole.Admin)
            {
                throw new ForbiddenException("room.admin_vs_admin", "Only the owner can remove another admin.");
            }
        }

        return target;
    }

    private async Task<ClubRole> EnsureModeratorAsync(Club club, long actorId, CancellationToken ct)
    {
        if (club.OwnerId == actorId)
        {
            return ClubRole.Owner;
        }

        var role = await db.ClubMembers.Where(m => m.ClubId == club.Id && m.UserId == actorId).Select(m => (ClubRole?)m.Role).FirstOrDefaultAsync(ct);
        return role is ClubRole.Admin or ClubRole.Owner
            ? role.Value
            : throw new ForbiddenException("room.forbidden", "Only the club owner or an admin can do that.");
    }

    private void EnsureInRoom(long clubId, long userId)
    {
        if (registry.GetUserRoom(userId) != clubId)
        {
            throw new BadRequestException("room.not_in_room", "Join the club room first.");
        }
    }

    private async Task UpsertVisitAsync(long clubId, long userId, DateTimeOffset now, CancellationToken ct)
    {
        var updated = await db.ClubVisits.Where(v => v.ClubId == clubId && v.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(v => v.LastVisitedAt, now), ct);
        if (updated == 0)
        {
            db.ClubVisits.Add(new ClubVisit { ClubId = clubId, UserId = userId, LastVisitedAt = now });
        }
    }

    private static void ClearSeat(ClubSeat seat)
    {
        seat.UserId = null;
        seat.TakenAt = null;
        seat.IsMuted = false;
    }

    private static void ValidateIndex(int index)
    {
        if (index is < 1 or > Club.SeatCount)
        {
            throw new BadRequestException("room.invalid_seat", $"Seat must be between 1 and {Club.SeatCount}.");
        }
    }

    private static string? Truncate(string? value, int max)
    {
        var v = value?.Trim();
        return string.IsNullOrEmpty(v) ? null : v.Length <= max ? v : v[..max];
    }
}
