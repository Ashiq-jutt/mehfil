import { PermissionsAndroid, Platform } from 'react-native';
import {
  AudioProfileType,
  AudioScenarioType,
  ChannelProfileType,
  ClientRoleType,
  ConnectionStateType,
  createAgoraRtcEngine,
  IRtcEngine,
} from 'react-native-agora';

import { SpeakingDetector } from './speakingDetector';
import type { VoiceTokenDto } from '../api/types';

export type VoiceStatus = 'idle' | 'joining' | 'connected' | 'failed';

export interface VoiceEvents {
  onStatus: (status: VoiceStatus, detail?: string) => void;
  /** Local speaking state changed (drives the hub SetSpeaking call). */
  onLocalSpeaking: (speaking: boolean) => void;
  /** The token is about to expire; fetch a fresh one and call renewToken. */
  onTokenExpiring: () => void;
}

const LOCAL_UID = 0;

/**
 * Thin wrapper over the Agora RTC engine for the club room: join as a listener, become a
 * publisher when the mic is on, speaker routing, token renewal and local speaking detection.
 */
class AgoraVoice {
  private engine: IRtcEngine | null = null;
  private events: VoiceEvents | null = null;
  private detector = new SpeakingDetector();
  private appId: string | null = null;
  private channel: string | null = null;

  async requestMicPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS prompts on first capture via NSMicrophoneUsageDescription
    }
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
      title: 'Microphone',
      message: 'Mehfil needs the microphone so you can talk in club rooms.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  async join(token: VoiceTokenDto, events: VoiceEvents): Promise<void> {
    this.events = events;
    const engine = this.ensureEngine(token.appId);
    this.channel = token.channel;
    events.onStatus('joining');

    const code = engine.joinChannel(token.token, token.channel, token.uid, {
      clientRoleType: ClientRoleType.ClientRoleAudience,
      publishMicrophoneTrack: false,
      autoSubscribeAudio: true,
    });
    if (code !== 0) {
      events.onStatus('failed', `joinChannel returned ${code}`);
    }
  }

  renewToken(token: string) {
    this.engine?.renewToken(token);
  }

  /** Publisher when on, audience when off. */
  setMicEnabled(enabled: boolean) {
    const engine = this.engine;
    if (!engine) {
      return;
    }
    if (enabled) {
      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      engine.enableLocalAudio(true);
      engine.muteLocalAudioStream(false);
    } else {
      engine.muteLocalAudioStream(true);
      engine.enableLocalAudio(false);
      engine.setClientRole(ClientRoleType.ClientRoleAudience);
      const change = this.detector.reset();
      if (change !== null) {
        this.events?.onLocalSpeaking(change);
      }
    }
  }

  /** true = loudspeaker + hear everyone; false = mute all remote audio. */
  setSpeakerEnabled(enabled: boolean) {
    const engine = this.engine;
    if (!engine) {
      return;
    }
    engine.muteAllRemoteAudioStreams(!enabled);
    engine.setEnableSpeakerphone(enabled);
  }

  leave() {
    if (this.engine) {
      this.engine.leaveChannel();
    }
    this.channel = null;
    this.detector.reset();
    this.events?.onStatus('idle');
    this.events = null;
  }

  destroy() {
    this.leave();
    this.engine?.release();
    this.engine = null;
    this.appId = null;
  }

  get isInChannel() {
    return this.channel !== null;
  }

  private ensureEngine(appId: string): IRtcEngine {
    if (this.engine && this.appId === appId) {
      return this.engine;
    }
    this.engine?.release();

    const engine = createAgoraRtcEngine();
    engine.initialize({
      appId,
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });
    engine.registerEventHandler({
      onJoinChannelSuccess: () => this.events?.onStatus('connected'),
      onError: (err, msg) => this.events?.onStatus('failed', `${msg} (${err})`),
      onConnectionStateChanged: (_connection, state) => {
        if (state === ConnectionStateType.ConnectionStateFailed) {
          this.events?.onStatus('failed', 'Voice connection failed');
        } else if (state === ConnectionStateType.ConnectionStateConnected) {
          this.events?.onStatus('connected');
        }
      },
      onTokenPrivilegeWillExpire: () => this.events?.onTokenExpiring(),
      onAudioVolumeIndication: (_connection, speakers) => {
        const local = speakers.find(s => s.uid === LOCAL_UID);
        if (!local) {
          return;
        }
        const change = this.detector.update(local.volume ?? 0, Date.now());
        if (change !== null) {
          this.events?.onLocalSpeaking(change);
        }
      },
    });
    engine.enableAudio();
    engine.setAudioProfile(AudioProfileType.AudioProfileSpeechStandard, AudioScenarioType.AudioScenarioChatroom);
    engine.setDefaultAudioRouteToSpeakerphone(true);
    engine.enableAudioVolumeIndication(300, 3, true);

    this.engine = engine;
    this.appId = appId;
    return engine;
  }
}

export const agoraVoice = new AgoraVoice();
