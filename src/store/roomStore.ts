import type { HubConnection } from '@microsoft/signalr';
import { create } from 'zustand';

import { roomApi, toApiError } from '../api';
import type { ClubMessageDto, ClubRole, GiftEventDto, RoomClubDto, RoomStateDto, RoomUserDto, SeatDto } from '../api/types';
import type { RoomEntry } from '../features/room/EntryOverlay';
import { entryStyle } from '../features/store/cosmetics';
import { ensureConnected, getRoomConnection, parseHubError } from '../realtime/roomConnection';
import { agoraVoice, VoiceStatus } from '../voice/agoraVoice';
import { useAuthStore } from './authStore';
import { toast } from './toastStore';

export type FeedItem =
  | { kind: 'message'; id: string; message: ClubMessageDto }
  | { kind: 'system'; id: string; text: string; createdAt: string };

export type RoomStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface RoomState {
  status: RoomStatus;
  error: string | null;
  clubId: string | null;
  club: RoomClubDto | null;
  myRole: ClubRole | null;
  mySeatIndex: number | null;
  onlineCount: number;
  seats: SeatDto[];
  users: Record<string, RoomUserDto>;
  feed: FeedItem[];
  hasMoreHistory: boolean;
  loadingHistory: boolean;
  micEnabled: boolean;
  speakerEnabled: boolean;
  voiceStatus: VoiceStatus;
  voiceError: string | null;
  /** Set when the server removed us (kicked / banned / moved); the screen leaves. */
  removedReason: string | null;
  /** Most recent gift for the floating banner; cleared by the screen when the animation ends. */
  lastGift: GiftEventDto | null;
  /** Most recent arrival with a Club Store entry style; drives the fly-across animation. */
  lastEntry: RoomEntry | null;
  /** Club level reached by the last gift, for the celebration burst. */
  levelUp: number | null;

  join: (clubId: string) => Promise<void>;
  leave: () => Promise<void>;
  sendMessage: (text: string) => Promise<boolean>;
  loadOlder: () => Promise<void>;
  setMic: (enabled: boolean) => Promise<void>;
  setSpeaker: (enabled: boolean) => void;
  connectVoice: () => Promise<void>;
  takeSeat: (index: number) => Promise<void>;
  leaveSeat: () => Promise<void>;
  applyState: (state: RoomStateDto) => void;
  clearGift: () => void;
  clearEntry: () => void;
  clearLevelUp: () => void;
  reset: () => void;
}

const HISTORY_PAGE = 30;
let handlersBound = false;
let systemCounter = 0;

const initial = {
  status: 'idle' as RoomStatus,
  error: null,
  clubId: null,
  club: null,
  myRole: null,
  mySeatIndex: null,
  onlineCount: 0,
  seats: [] as SeatDto[],
  users: {} as Record<string, RoomUserDto>,
  feed: [] as FeedItem[],
  hasMoreHistory: true,
  loadingHistory: false,
  micEnabled: false,
  speakerEnabled: true,
  voiceStatus: 'idle' as VoiceStatus,
  voiceError: null,
  removedReason: null,
  lastGift: null as GiftEventDto | null,
  lastEntry: null as RoomEntry | null,
  levelUp: null as number | null,
};

export const useRoomStore = create<RoomState>((set, get) => {
  const myId = () => useAuthStore.getState().user?.id;

  const systemItem = (text: string): FeedItem => ({
    kind: 'system',
    id: `sys-${Date.now()}-${systemCounter++}`,
    text,
    createdAt: new Date().toISOString(),
  });

  const appendFeed = (item: FeedItem) => set(state => ({ feed: [...state.feed.slice(-199), item] }));

  const bindHandlers = (hub: HubConnection) => {
    if (handlersBound) {
      return;
    }
    handlersBound = true;

    hub.on('UserJoined', (user: RoomUserDto, onlineCount: number) => {
      set(state => ({ users: { ...state.users, [user.id]: user }, onlineCount }));
      if (user.id !== myId()) {
        const arrival = entryStyle(user.entryStyleCode);
        appendFeed(systemItem(arrival ? `${user.displayName} arrived by ${arrival.label} ${arrival.emoji}` : `${user.displayName} entered the room`));
        if (arrival && user.entryStyleCode) {
          set({ lastEntry: { id: `${user.id}-${Date.now()}`, displayName: user.displayName, entryStyleCode: user.entryStyleCode } });
        }
      }
    });

    hub.on('UserLeft', (userId: string, onlineCount: number) => {
      set(state => {
        const users = { ...state.users };
        delete users[userId];
        return { users, onlineCount };
      });
    });

    hub.on('SeatChanged', (seat: SeatDto) => {
      set(state => {
        const seats = state.seats.map(s => (s.index === seat.index ? seat : s));
        const mine = seats.find(s => s.user?.id === myId())?.index ?? null;
        const lostSeat = state.mySeatIndex !== null && mine === null;
        if (lostSeat && state.micEnabled) {
          agoraVoice.setMicEnabled(false);
        }
        return { seats, mySeatIndex: mine, micEnabled: lostSeat ? false : state.micEnabled };
      });
    });

    hub.on('MessageReceived', (message: ClubMessageDto) => {
      appendFeed({ kind: 'message', id: `m-${message.id}`, message });
    });

    hub.on('MessageDeleted', (messageId: number) => {
      set(state => ({ feed: state.feed.filter(f => !(f.kind === 'message' && f.message.id === messageId)) }));
    });

    hub.on('AnnouncementChanged', (text: string | null) => {
      set(state => (state.club ? { club: { ...state.club, announcement: text } } : {}));
    });

    hub.on('UserStateChanged', (userId: string, micEnabled: boolean, isSpeaking: boolean) => {
      set(state => {
        const user = state.users[userId];
        const users = user ? { ...state.users, [userId]: { ...user, micEnabled, isSpeaking } } : state.users;
        const seats = state.seats.map(s => (s.user?.id === userId ? { ...s, user: { ...s.user!, micEnabled, isSpeaking } } : s));
        const mine = userId === myId() ? { micEnabled } : {};
        if (userId === myId() && !micEnabled && state.micEnabled) {
          agoraVoice.setMicEnabled(false); // an admin muted our seat
        }
        return { users, seats, ...mine };
      });
    });

    hub.on('GiftReceived', (gift: GiftEventDto) => {
      set(state => ({
        lastGift: gift,
        levelUp: gift.leveledUp ? gift.clubLevel.level : state.levelUp,
        club: state.club
          ? {
              ...state.club,
              level: gift.clubLevel.level,
              jarHearts: gift.clubLevel.jarHearts,
              jarTarget: gift.clubLevel.jarTarget,
              jarResetsAt: gift.clubLevel.jarResetsAt,
              jarsCollected: gift.clubLevel.jarsCollected,
              jarsForNextLevel: gift.clubLevel.jarsForNextLevel,
              totalHearts: gift.clubLevel.totalHearts,
            }
          : state.club,
      }));
    });

    hub.on('RemovedFromRoom', (reason: string) => {
      agoraVoice.leave();
      set({ removedReason: reason, status: 'idle' });
    });

    hub.onreconnecting(() => {
      if (get().clubId) {
        set({ status: 'reconnecting' });
      }
    });

    hub.onreconnected(async () => {
      const clubId = get().clubId;
      if (!clubId) {
        return;
      }
      try {
        const state = await hub.invoke<RoomStateDto>('JoinRoom', clubId);
        get().applyState(state);
        set({ status: 'connected' });
        appendFeed(systemItem('Reconnected'));
        if (!agoraVoice.isInChannel) {
          get().connectVoice().catch(() => undefined);
        }
      } catch (error) {
        set({ status: 'error', error: parseHubError(error).message });
      }
    });

    hub.onclose(() => {
      if (get().clubId && get().status !== 'idle') {
        set({ status: 'error', error: 'Connection to the room was lost.' });
      }
    });
  };

  return {
    ...initial,

    applyState(state) {
      const users: Record<string, RoomUserDto> = {};
      state.users.forEach(u => {
        users[u.id] = u;
      });
      const me = myId();
      set({
        club: state.club,
        myRole: state.myRole ?? null,
        mySeatIndex: state.mySeatIndex ?? null,
        onlineCount: state.onlineCount,
        seats: state.seats,
        users,
        micEnabled: me ? users[me]?.micEnabled ?? false : false,
        feed: state.recentMessages.map(m => ({ kind: 'message' as const, id: `m-${m.id}`, message: m })),
        hasMoreHistory: state.recentMessages.length >= HISTORY_PAGE,
      });
    },

    async join(clubId) {
      set({ ...initial, status: 'connecting', clubId });
      try {
        const hub = await ensureConnected();
        bindHandlers(hub);
        const state = await hub.invoke<RoomStateDto>('JoinRoom', clubId);
        get().applyState(state);
        set({ status: 'connected' });
        get().connectVoice().catch(() => undefined);
      } catch (error) {
        const { message } = parseHubError(error);
        set({ status: 'error', error: message });
      }
    },

    async connectVoice() {
      const { clubId } = get();
      if (!clubId) {
        return;
      }
      try {
        const token = await roomApi.voiceToken(clubId);
        await agoraVoice.join(token, {
          onStatus: (voiceStatus, detail) => set({ voiceStatus, voiceError: voiceStatus === 'failed' ? detail ?? 'Voice failed' : null }),
          onLocalSpeaking: speaking => {
            getRoomConnection().invoke('SetSpeaking', speaking).catch(() => undefined);
          },
          onTokenExpiring: () => {
            const id = get().clubId;
            if (id) {
              roomApi.voiceToken(id).then(t => agoraVoice.renewToken(t.token)).catch(() => undefined);
            }
          },
        });
        agoraVoice.setSpeakerEnabled(get().speakerEnabled);
      } catch (error) {
        const apiError = toApiError(error);
        set({ voiceStatus: 'failed', voiceError: apiError.status === 503 ? 'Voice is not configured on the server yet.' : apiError.message });
      }
    },

    setSpeaker(enabled) {
      set({ speakerEnabled: enabled });
      agoraVoice.setSpeakerEnabled(enabled);
    },

    async leave() {
      const hub = getRoomConnection();
      try {
        if (get().clubId) {
          await hub.invoke('LeaveRoom');
        }
      } catch {
        // Already disconnected; nothing to do.
      } finally {
        agoraVoice.leave();
        set({ ...initial });
      }
    },

    async sendMessage(text) {
      const body = text.trim();
      if (!body) {
        return false;
      }
      try {
        const hub = await ensureConnected();
        await hub.invoke<ClubMessageDto>('SendMessage', body);
        return true;
      } catch (error) {
        toast.error(parseHubError(error).message);
        return false;
      }
    },

    async loadOlder() {
      const { clubId, feed, hasMoreHistory, loadingHistory } = get();
      if (!clubId || !hasMoreHistory || loadingHistory) {
        return;
      }
      const oldest = feed.find(f => f.kind === 'message');
      const before = oldest && oldest.kind === 'message' ? oldest.message.id : null;
      set({ loadingHistory: true });
      try {
        const older = await roomApi.messages(clubId, before, HISTORY_PAGE);
        set(state => ({
          feed: [...older.map(m => ({ kind: 'message' as const, id: `m-${m.id}`, message: m })), ...state.feed],
          hasMoreHistory: older.length >= HISTORY_PAGE,
        }));
      } catch (error) {
        toast.error(toApiError(error).message);
      } finally {
        set({ loadingHistory: false });
      }
    },

    async setMic(enabled) {
      if (enabled && !(await agoraVoice.requestMicPermission())) {
        toast.error('Microphone permission is required to talk.');
        return;
      }
      try {
        const hub = await ensureConnected();
        await hub.invoke('SetMic', enabled);
        set({ micEnabled: enabled });
        agoraVoice.setMicEnabled(enabled);
      } catch (error) {
        toast.error(parseHubError(error).message);
      }
    },

    async takeSeat(index) {
      const { clubId } = get();
      if (!clubId) {
        return;
      }
      try {
        await roomApi.takeSeat(clubId, index);
      } catch (error) {
        toast.error(toApiError(error).message);
      }
    },

    async leaveSeat() {
      const { clubId } = get();
      if (!clubId) {
        return;
      }
      try {
        await roomApi.leaveSeat(clubId);
        agoraVoice.setMicEnabled(false);
        set({ micEnabled: false });
      } catch (error) {
        toast.error(toApiError(error).message);
      }
    },

    clearGift() {
      set({ lastGift: null });
    },

    clearEntry() {
      set({ lastEntry: null });
    },

    clearLevelUp() {
      set({ levelUp: null });
    },

    reset() {
      set({ ...initial });
    },
  };
});
