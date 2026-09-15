import { useAuthStore } from '../authStore';
import { useRoomStore } from '../roomStore';
import type { RoomStateDto, RoomUserDto, SeatDto } from '../../api/types';

type Handler = (...args: unknown[]) => void;
const mockHandlers: Record<string, Handler> = {};
const mockHub = {
  state: 'Connected',
  on: jest.fn((name: string, handler: Handler) => {
    mockHandlers[name] = handler;
  }),
  onreconnecting: jest.fn(),
  onreconnected: jest.fn(),
  onclose: jest.fn(),
  invoke: jest.fn(),
};

jest.mock('../../realtime/roomConnection', () => ({
  ensureConnected: jest.fn(async () => mockHub),
  getRoomConnection: jest.fn(() => mockHub),
  parseHubError: (e: unknown) => ({ code: 'x', message: e instanceof Error ? e.message : String(e) }),
}));

jest.mock('../../api/room', () => ({
  roomApi: {
    messages: jest.fn(async () => []),
    takeSeat: jest.fn(async () => undefined),
    leaveSeat: jest.fn(async () => undefined),
    voiceToken: jest.fn(async () => ({ appId: 'app', channel: '29451765', uid: 1, token: 't', expiresAt: '', canPublish: true })),
  },
}));

jest.mock('../../voice/agoraVoice', () => ({
  agoraVoice: {
    join: jest.fn(async () => undefined),
    leave: jest.fn(),
    setMicEnabled: jest.fn(),
    setSpeakerEnabled: jest.fn(),
    renewToken: jest.fn(),
    requestMicPermission: jest.fn(async () => true),
    isInChannel: false,
  },
}));

const me: RoomUserDto = { id: 'MOBI4875', displayName: 'Mobile Developer', level: 2, role: 'Member', gender: 'Male', royalLevel: 'None', micEnabled: false, isSpeaking: false };
const other: RoomUserDto = { ...me, id: 'ANAY1234', displayName: 'Anaya', role: 'Owner' };

const seats: SeatDto[] = Array.from({ length: 10 }, (_, i) => ({ index: i + 1, isLocked: false, isMuted: false, isOwnerSeat: i + 1 === 5, user: i + 1 === 5 ? other : null }));

const state: RoomStateDto = {
  club: { id: '29451765', name: 'ANAYA', level: 20, ownerId: other.id, jarHearts: 435, jarTarget: 500, jarResetsAt: '', jarsCollected: 61, jarsForNextLevel: 150, totalHearts: 14700, followerCount: 3, isFollowing: false },
  myRole: 'Member',
  mySeatIndex: null,
  onlineCount: 2,
  seats,
  users: [me, other],
  recentMessages: [{ id: 10, type: 'Text', text: 'welcome', sender: other, createdAt: '' }],
};

describe('roomStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: me.id } as never });
    useRoomStore.getState().reset();
    mockHub.invoke.mockReset();
  });

  it('join() applies the room state and connects', async () => {
    mockHub.invoke.mockResolvedValueOnce(state);

    await useRoomStore.getState().join('29451765');

    const s = useRoomStore.getState();
    expect(s.status).toBe('connected');
    expect(s.club?.name).toBe('ANAYA');
    expect(s.seats).toHaveLength(10);
    expect(s.seats[4].user?.id).toBe(other.id);
    expect(s.feed).toHaveLength(1);
    expect(Object.keys(s.users)).toHaveLength(2);
    expect(mockHub.invoke).toHaveBeenCalledWith('JoinRoom', '29451765');
  });

  it('applies realtime events: joins, seats, messages, deletions, removal', async () => {
    mockHub.invoke.mockResolvedValueOnce(state);
    await useRoomStore.getState().join('29451765');

    const newcomer: RoomUserDto = { ...me, id: 'RAJA0001', displayName: 'raja jutt' };
    mockHandlers.UserJoined(newcomer, 3);
    expect(useRoomStore.getState().onlineCount).toBe(3);
    expect(useRoomStore.getState().feed.at(-1)).toMatchObject({ kind: 'system', text: 'raja jutt entered the room' });

    mockHandlers.SeatChanged({ ...seats[0], user: me });
    expect(useRoomStore.getState().mySeatIndex).toBe(1);

    mockHandlers.UserStateChanged(me.id, true, true);
    expect(useRoomStore.getState().micEnabled).toBe(true);
    expect(useRoomStore.getState().seats[0].user?.isSpeaking).toBe(true);

    mockHandlers.SeatChanged({ ...seats[0], user: null });
    expect(useRoomStore.getState().mySeatIndex).toBeNull();
    expect(useRoomStore.getState().micEnabled).toBe(false);

    mockHandlers.MessageReceived({ id: 11, type: 'Text', text: 'hi', sender: newcomer, createdAt: '' });
    expect(useRoomStore.getState().feed.filter(f => f.kind === 'message')).toHaveLength(2);

    mockHandlers.MessageDeleted(11);
    expect(useRoomStore.getState().feed.filter(f => f.kind === 'message')).toHaveLength(1);

    mockHandlers.AnnouncementChanged('Be kind');
    expect(useRoomStore.getState().club?.announcement).toBe('Be kind');

    mockHandlers.UserLeft(newcomer.id, 2);
    expect(useRoomStore.getState().users[newcomer.id]).toBeUndefined();

    mockHandlers.RemovedFromRoom('kicked');
    expect(useRoomStore.getState().removedReason).toBe('kicked');
  });

  it('join() surfaces hub errors', async () => {
    mockHub.invoke.mockRejectedValueOnce(new Error('room.banned: You are banned from this club.'));

    await useRoomStore.getState().join('29451765');

    expect(useRoomStore.getState().status).toBe('error');
    expect(useRoomStore.getState().error).toContain('banned');
  });

  it('sendMessage() invokes the hub and rejects empty text', async () => {
    mockHub.invoke.mockResolvedValueOnce(state);
    await useRoomStore.getState().join('29451765');
    mockHub.invoke.mockResolvedValueOnce({ id: 12 });

    expect(await useRoomStore.getState().sendMessage('   ')).toBe(false);
    expect(await useRoomStore.getState().sendMessage('hello')).toBe(true);
    expect(mockHub.invoke).toHaveBeenLastCalledWith('SendMessage', 'hello');
  });
});
