namespace Mehfil.Infrastructure.Rooms;

/// <summary>
/// In-memory presence: which users (and which of their connections) are in which room.
/// Single-instance by design; move to Redis when the API scales out.
/// </summary>
public sealed class RoomRegistry
{
    private readonly object _gate = new();
    private readonly Dictionary<long, UserPresence> _users = new();
    private readonly Dictionary<string, long> _connections = new();
    private readonly Dictionary<long, HashSet<long>> _rooms = new();

    public sealed class UserPresence
    {
        public required long ClubId { get; init; }
        public required DateTimeOffset JoinedAt { get; init; }
        public HashSet<string> Connections { get; } = new(StringComparer.Ordinal);
        public bool MicEnabled { get; set; }
        public bool IsSpeaking { get; set; }
        public DateTimeOffset LastMessageAt { get; set; }
    }

    public sealed record JoinResult(bool IsFirstConnection, long? PreviousClubId);

    public sealed record LeaveResult(long ClubId, long UserId, bool UserLeft, DateTimeOffset JoinedAt);

    /// <summary>Registers a connection. When the user was in another room, that room id is returned so the caller can evict them there first.</summary>
    public JoinResult AddConnection(long clubId, long userId, string connectionId, DateTimeOffset now)
    {
        lock (_gate)
        {
            long? previous = null;
            if (_users.TryGetValue(userId, out var existing) && existing.ClubId != clubId)
            {
                previous = existing.ClubId;
                RemoveUserUnsafe(userId);
                existing = null;
            }

            if (existing is null)
            {
                existing = new UserPresence { ClubId = clubId, JoinedAt = now };
                _users[userId] = existing;
                if (!_rooms.TryGetValue(clubId, out var members))
                {
                    members = new HashSet<long>();
                    _rooms[clubId] = members;
                }

                members.Add(userId);
            }

            var first = existing.Connections.Count == 0;
            existing.Connections.Add(connectionId);
            _connections[connectionId] = userId;
            return new JoinResult(first, previous);
        }
    }

    public LeaveResult? RemoveConnection(string connectionId)
    {
        lock (_gate)
        {
            if (!_connections.Remove(connectionId, out var userId) || !_users.TryGetValue(userId, out var presence))
            {
                return null;
            }

            presence.Connections.Remove(connectionId);
            if (presence.Connections.Count > 0)
            {
                return new LeaveResult(presence.ClubId, userId, false, presence.JoinedAt);
            }

            RemoveUserUnsafe(userId);
            return new LeaveResult(presence.ClubId, userId, true, presence.JoinedAt);
        }
    }

    /// <summary>Removes a user from their room entirely. Returns the connections that were dropped.</summary>
    public (long ClubId, DateTimeOffset JoinedAt, IReadOnlyCollection<string> Connections)? RemoveUser(long userId)
    {
        lock (_gate)
        {
            if (!_users.TryGetValue(userId, out var presence))
            {
                return null;
            }

            var connections = presence.Connections.ToArray();
            RemoveUserUnsafe(userId);
            return (presence.ClubId, presence.JoinedAt, connections);
        }
    }

    public long? GetUserRoom(long userId)
    {
        lock (_gate)
        {
            return _users.TryGetValue(userId, out var p) ? p.ClubId : null;
        }
    }

    public IReadOnlyCollection<string> GetConnections(long userId)
    {
        lock (_gate)
        {
            return _users.TryGetValue(userId, out var p) ? p.Connections.ToArray() : [];
        }
    }

    public IReadOnlyList<long> GetUsers(long clubId)
    {
        lock (_gate)
        {
            return _rooms.TryGetValue(clubId, out var members) ? members.ToArray() : [];
        }
    }

    public int Count(long clubId)
    {
        lock (_gate)
        {
            return _rooms.TryGetValue(clubId, out var members) ? members.Count : 0;
        }
    }

    public (bool MicEnabled, bool IsSpeaking) GetState(long userId)
    {
        lock (_gate)
        {
            return _users.TryGetValue(userId, out var p) ? (p.MicEnabled, p.IsSpeaking) : (false, false);
        }
    }

    public (long ClubId, bool MicEnabled, bool IsSpeaking)? SetMic(long userId, bool enabled)
    {
        lock (_gate)
        {
            if (!_users.TryGetValue(userId, out var p))
            {
                return null;
            }

            p.MicEnabled = enabled;
            if (!enabled)
            {
                p.IsSpeaking = false;
            }

            return (p.ClubId, p.MicEnabled, p.IsSpeaking);
        }
    }

    public (long ClubId, bool MicEnabled, bool IsSpeaking)? SetSpeaking(long userId, bool speaking)
    {
        lock (_gate)
        {
            if (!_users.TryGetValue(userId, out var p))
            {
                return null;
            }

            p.IsSpeaking = speaking && p.MicEnabled;
            return (p.ClubId, p.MicEnabled, p.IsSpeaking);
        }
    }

    /// <summary>Returns false when the user sent a message less than <paramref name="minInterval"/> ago.</summary>
    public bool TryMarkMessage(long userId, DateTimeOffset now, TimeSpan minInterval)
    {
        lock (_gate)
        {
            if (!_users.TryGetValue(userId, out var p))
            {
                return false;
            }

            if (now - p.LastMessageAt < minInterval)
            {
                return false;
            }

            p.LastMessageAt = now;
            return true;
        }
    }

    private void RemoveUserUnsafe(long userId)
    {
        if (!_users.Remove(userId, out var presence))
        {
            return;
        }

        foreach (var connection in presence.Connections)
        {
            _connections.Remove(connection);
        }

        if (_rooms.TryGetValue(presence.ClubId, out var members))
        {
            members.Remove(userId);
            if (members.Count == 0)
            {
                _rooms.Remove(presence.ClubId);
            }
        }
    }
}
