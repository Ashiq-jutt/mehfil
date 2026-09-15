import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { roomApi, toApiError } from '../../api';
import { AppText, Button, ErrorState, LoadingState } from '../../components';
import { useFollowClub } from '../../hooks/useClubs';
import type { MainStackScreenProps } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { toast } from '../../store/toastStore';
import { PlayerCardDialog } from '../profile/PlayerCardDialog';
import { ChatFeed } from './ChatFeed';
import { AnnouncementDialog, ExitDialog, SeatAction, SeatMenuDialog } from './dialogs/RoomDialogs';
import { RoomBackdrop } from './RoomBackdrop';
import { RoomHeader } from './RoomHeader';
import { RoomBottomBar, RoomRightRail } from './RoomRails';
import { SeatGrid } from './SeatGrid';
import { styles } from './ClubRoomScreen.styles';
import type { RoomUserDto, SeatDto } from '../../api/types';

const comingSoon = (what: string, phase: number) => toast.info(`${what} arrives in phase ${phase}.`);

export function ClubRoomScreen({ route, navigation }: MainStackScreenProps<'ClubRoom'>) {
  const { publicId } = route.params;
  const myId = useAuthStore(s => s.user?.id);
  const room = useRoomStore();
  const follow = useFollowClub();

  const [exitVisible, setExitVisible] = useState(false);
  const [menuSeat, setMenuSeat] = useState<SeatDto | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const exitConfirmed = useRef(false);

  const canModerate = room.myRole === 'Owner' || room.myRole === 'Admin';
  const isOwner = room.myRole === 'Owner';

  // Join on mount, leave on unmount.
  useEffect(() => {
    room.join(publicId).catch(() => undefined);
    return () => {
      useRoomStore.getState().leave().catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId]);

  // Back gesture / hardware back asks for confirmation first.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (exitConfirmed.current || useRoomStore.getState().removedReason) {
        return;
      }
      event.preventDefault();
      setExitVisible(true);
    });
    return unsubscribe;
  }, [navigation]);

  // Kicked / banned / moved: inform and leave.
  useEffect(() => {
    if (!room.removedReason) {
      return;
    }
    const messages: Record<string, string> = {
      kicked: 'You were removed from the room.',
      banned: 'You have been banned from this club.',
      moved: 'You joined another room.',
    };
    toast.info(messages[room.removedReason] ?? 'You left the room.');
    exitConfirmed.current = true;
    navigation.goBack();
  }, [room.removedReason, navigation]);

  const exit = () => {
    exitConfirmed.current = true;
    setExitVisible(false);
    navigation.goBack();
  };

  const onPressSeat = useCallback(
    (seat: SeatDto) => {
      const seatedMe = room.mySeatIndex !== null;
      if (!seat.user && !seat.isLocked && !canModerate && !seat.isOwnerSeat) {
        room.takeSeat(seat.index).catch(() => undefined);
        return;
      }
      if (!seat.user && seat.isLocked && !canModerate) {
        toast.info('That seat is locked.');
        return;
      }
      if (!seat.user && seat.isOwnerSeat && !isOwner) {
        toast.info('That seat is reserved for the club owner.');
        return;
      }
      if (!seat.user && !seat.isLocked && canModerate && !seatedMe && !seat.isOwnerSeat) {
        setMenuSeat(seat);
        return;
      }
      setMenuSeat(seat);
    },
    [room, canModerate, isOwner],
  );

  const runSeatAction = async (action: SeatAction) => {
    const seat = menuSeat;
    setMenuSeat(null);
    if (!seat) {
      return;
    }
    try {
      switch (action) {
        case 'sit':
          await room.takeSeat(seat.index);
          break;
        case 'leaveSeat':
          await room.leaveSeat();
          break;
        case 'lock':
        case 'unlock':
          await roomApi.lockSeat(publicId, seat.index, action === 'lock');
          break;
        case 'mute':
        case 'unmute':
          await roomApi.muteSeat(publicId, seat.index, action === 'mute');
          break;
        case 'removeFromSeat':
          await roomApi.kickFromSeat(publicId, seat.index);
          break;
        case 'kick':
          if (seat.user) {
            await roomApi.kickUser(publicId, seat.user.id);
            toast.success(`${seat.user.displayName} was removed.`);
          }
          break;
        case 'ban':
          if (seat.user) {
            await roomApi.banUser(publicId, seat.user.id, null);
            toast.success(`${seat.user.displayName} was banned.`);
          }
          break;
        case 'viewCard':
          if (seat.user) {
            setCard(seat.user.id);
          }
          break;
      }
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const saveAnnouncement = async (text: string) => {
    setSavingAnnouncement(true);
    try {
      await roomApi.setAnnouncement(publicId, text || null);
      setAnnouncementOpen(false);
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const onPressUser = useCallback((user: RoomUserDto) => setCard(user.id), []);

  const club = room.club;

  return (
    <View style={styles.root}>
      <RoomBackdrop />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        {club ? (
          <RoomHeader
            club={club}
            onlineCount={room.onlineCount}
            isOwner={isOwner}
            onPressInfo={() => navigation.navigate('ClubInfo', { publicId })}
            onToggleFollow={() => follow.mutate({ publicId, follow: !club.isFollowing }, { onSuccess: r => useRoomStore.setState(s => (s.club ? { club: { ...s.club, isFollowing: r.isFollowing, followerCount: r.followerCount } } : {})) })}
            onExit={() => setExitVisible(true)}
          />
        ) : null}

        {room.status === 'connecting' && !club ? <LoadingState label="Entering the room…" /> : null}
        {room.status === 'error' && !club ? (
          <ErrorState title="Could not enter the room" message={room.error ?? undefined} actionLabel="Try again" onAction={() => room.join(publicId)} />
        ) : null}

        {club ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
            <SeatGrid seats={room.seats} myId={myId} onPressSeat={onPressSeat} />

            <View style={styles.middle}>
              <View style={styles.chatColumn}>
                <Pressable
                  accessibilityRole="button"
                  disabled={!canModerate}
                  onPress={() => setAnnouncementOpen(true)}
                  style={styles.announcement}>
                  <AppText variant="tiny" color="textMuted">
                    ANNOUNCEMENT
                  </AppText>
                  <AppText variant="caption" numberOfLines={3}>
                    {club.announcement || (canModerate ? 'Tap to write an announcement' : 'Welcome!')}
                  </AppText>
                </Pressable>

                {room.status === 'reconnecting' ? (
                  <View style={styles.reconnecting}>
                    <AppText variant="tiny">Reconnecting…</AppText>
                  </View>
                ) : null}
                {room.status === 'error' ? (
                  <View style={styles.reconnecting}>
                    <AppText variant="tiny">{room.error}</AppText>
                    <Button label="Reconnect" variant="ghost" onPress={() => room.join(publicId)} style={styles.reconnectButton} />
                  </View>
                ) : null}

                <ChatFeed
                  feed={room.feed}
                  loadingHistory={room.loadingHistory}
                  onLoadOlder={room.loadOlder}
                  onPressUser={onPressUser}
                  onLongPressMessage={
                    canModerate
                      ? item => roomApi.deleteMessage(publicId, item.message.id).catch(e => toast.error(toApiError(e).message))
                      : undefined
                  }
                />
              </View>

              <RoomRightRail
                totalHearts={club.totalHearts}
                onPressTrophy={() => comingSoon('Clubs Levels', 8)}
                onPressJar={() => comingSoon('The gift jar', 8)}
                onPressOffer={() => comingSoon('Offers', 8)}
                onPressActivity={() => comingSoon('Activities', 9)}
              />
            </View>

            <RoomBottomBar
              micEnabled={room.micEnabled}
              canUseMic={room.mySeatIndex !== null}
              speakerOn={speakerOn}
              onToggleMic={() => room.setMic(!room.micEnabled)}
              onToggleSpeaker={() => {
                setSpeakerOn(v => !v);
                comingSoon('Audio', 7);
              }}
              onSend={room.sendMessage}
              onPressGift={() => comingSoon('Gifts', 8)}
            />
          </KeyboardAvoidingView>
        ) : null}
      </SafeAreaView>

      <ExitDialog visible={exitVisible} onCancel={() => setExitVisible(false)} onExit={exit} />
      <SeatMenuDialog
        seat={menuSeat}
        isMe={!!menuSeat?.user && menuSeat.user.id === myId}
        canModerate={canModerate}
        isOwnerOccupant={!!menuSeat?.user && menuSeat.user.role === 'Owner'}
        onClose={() => setMenuSeat(null)}
        onAction={runSeatAction}
      />
      <AnnouncementDialog
        visible={announcementOpen}
        initial={club?.announcement ?? ''}
        saving={savingAnnouncement}
        onClose={() => setAnnouncementOpen(false)}
        onSave={saveAnnouncement}
      />
      <PlayerCardDialog visible={card !== null} onClose={() => setCard(null)} publicId={card} />
    </View>
  );
}
