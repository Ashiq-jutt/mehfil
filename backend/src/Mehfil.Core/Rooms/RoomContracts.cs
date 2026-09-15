using Mehfil.Core.Enums;

namespace Mehfil.Core.Rooms;

public sealed record RoomUserDto(
    string Id,
    string DisplayName,
    string? AvatarUrl,
    int Level,
    ClubRole Role,
    Gender Gender,
    RoyalLevel RoyalLevel,
    bool MicEnabled,
    bool IsSpeaking);

public sealed record SeatDto(int Index, bool IsLocked, bool IsMuted, bool IsOwnerSeat, RoomUserDto? User);

public sealed record ClubMessageDto(long Id, MessageType Type, string Text, RoomUserDto? Sender, DateTimeOffset CreatedAt, long? GiftTransactionId);

public sealed record RoomClubDto(
    string Id,
    string Name,
    string? CoverUrl,
    int Level,
    string? Announcement,
    string OwnerId,
    long JarHearts,
    long JarTarget,
    DateTimeOffset JarResetsAt,
    int JarsCollected,
    int JarsForNextLevel,
    long TotalHearts,
    int FollowerCount,
    bool IsFollowing);

/// <summary>Everything the room screen needs on entry (and after a reconnect).</summary>
public sealed record RoomStateDto(
    RoomClubDto Club,
    ClubRole? MyRole,
    int? MySeatIndex,
    int OnlineCount,
    IReadOnlyList<SeatDto> Seats,
    IReadOnlyList<RoomUserDto> Users,
    IReadOnlyList<ClubMessageDto> RecentMessages);

public sealed record ClubBanDto(string UserId, string DisplayName, string? AvatarUrl, string ByUserId, string? Reason, DateTimeOffset CreatedAt);

public sealed record SendMessageRequest(string Text);
public sealed record SetAnnouncementRequest(string? Text);
public sealed record LockSeatRequest(bool Locked);
public sealed record MuteSeatRequest(bool Muted);
public sealed record BanRequest(string? Reason);

public static class RoomRemovalReasons
{
    public const string Kicked = "kicked";
    public const string Banned = "banned";
    public const string MovedRooms = "moved";
}

/// <summary>Realtime fan-out. Implemented over SignalR in the API layer; services stay transport-agnostic.</summary>
public interface IRoomNotifier
{
    Task AddToRoomAsync(long clubId, string connectionId);
    Task RemoveFromRoomAsync(long clubId, string connectionId);

    Task UserJoinedAsync(long clubId, RoomUserDto user, int onlineCount);
    Task UserLeftAsync(long clubId, string userPublicId, int onlineCount);
    Task SeatChangedAsync(long clubId, SeatDto seat);
    Task MessageReceivedAsync(long clubId, ClubMessageDto message);
    Task MessageDeletedAsync(long clubId, long messageId);
    Task AnnouncementChangedAsync(long clubId, string? text);
    Task UserStateChangedAsync(long clubId, string userPublicId, bool micEnabled, bool isSpeaking);
    Task GiftReceivedAsync(long clubId, Economy.GiftEventDto gift);

    /// <summary>Tells specific connections they were removed (kick/ban/moved) and drops them from the room group.</summary>
    Task RemovedFromRoomAsync(long clubId, IReadOnlyCollection<string> connectionIds, string reason);
}

public interface IRoomService
{
    Task<RoomStateDto> JoinAsync(string clubPublicId, long userId, string connectionId, CancellationToken ct);

    /// <summary>Called on disconnect or explicit leave. Safe to call for connections that never joined.</summary>
    Task LeaveConnectionAsync(string connectionId, CancellationToken ct);

    Task<RoomStateDto> GetStateAsync(string clubPublicId, long userId, CancellationToken ct);

    /// <summary>Sends a chat message to the room the user is currently in.</summary>
    Task<ClubMessageDto> SendMessageAsync(long userId, string text, CancellationToken ct);

    /// <summary>Oldest-first page of messages older than <paramref name="beforeId"/>.</summary>
    Task<IReadOnlyList<ClubMessageDto>> GetMessagesAsync(string clubPublicId, long? beforeId, int limit, CancellationToken ct);

    Task DeleteMessageAsync(string clubPublicId, long messageId, long actorId, CancellationToken ct);
    Task SetAnnouncementAsync(string clubPublicId, long actorId, string? text, CancellationToken ct);

    Task<SeatDto> TakeSeatAsync(string clubPublicId, int index, long userId, CancellationToken ct);
    Task<SeatDto?> LeaveSeatAsync(string clubPublicId, long userId, CancellationToken ct);
    Task<SeatDto> LockSeatAsync(string clubPublicId, int index, bool locked, long actorId, CancellationToken ct);
    Task<SeatDto> MuteSeatAsync(string clubPublicId, int index, bool muted, long actorId, CancellationToken ct);
    Task<SeatDto> KickFromSeatAsync(string clubPublicId, int index, long actorId, CancellationToken ct);

    Task KickUserAsync(string clubPublicId, string userPublicId, long actorId, CancellationToken ct);
    Task<ClubBanDto> BanUserAsync(string clubPublicId, string userPublicId, string? reason, long actorId, CancellationToken ct);
    Task UnbanUserAsync(string clubPublicId, string userPublicId, long actorId, CancellationToken ct);
    Task<IReadOnlyList<ClubBanDto>> ListBansAsync(string clubPublicId, long actorId, CancellationToken ct);

    Task SetMicAsync(long userId, bool enabled, CancellationToken ct);
    Task SetSpeakingAsync(long userId, bool speaking, CancellationToken ct);
}
