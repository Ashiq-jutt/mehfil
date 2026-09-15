/* eslint-env jest */
// Native modules are mocked here so unit tests run without a device.

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: { API_BASE_URL: 'http://test.local', DEV_LOGIN_ENABLED: 'true' },
  Config: { API_BASE_URL: 'http://test.local', DEV_LOGIN_ENABLED: 'true' },
}));

jest.mock('react-native-keychain', () => {
  let stored = null;
  return {
    ACCESSIBLE: { AFTER_FIRST_UNLOCK: 'AfterFirstUnlock' },
    getGenericPassword: jest.fn(async () => stored),
    setGenericPassword: jest.fn(async (username, password) => {
      stored = { username, password };
      return true;
    }),
    resetGenericPassword: jest.fn(async () => {
      stored = null;
      return true;
    }),
    __reset: () => {
      stored = null;
    },
  };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({ type: 'success', data: { idToken: 'google-id-token' } })),
    signOut: jest.fn(async () => undefined),
  },
  isSuccessResponse: response => response.type === 'success',
  isErrorWithCode: error => !!error && typeof error.code === 'string',
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: { setString: jest.fn(), getString: jest.fn(async () => '') },
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
  launchCamera: jest.fn(async () => ({ didCancel: true })),
}));

jest.mock('react-native-agora', () => {
  const engine = {
    initialize: jest.fn(() => 0),
    registerEventHandler: jest.fn(() => true),
    enableAudio: jest.fn(() => 0),
    setAudioProfile: jest.fn(() => 0),
    enableAudioVolumeIndication: jest.fn(() => 0),
    setDefaultAudioRouteToSpeakerphone: jest.fn(() => 0),
    joinChannel: jest.fn(() => 0),
    leaveChannel: jest.fn(() => 0),
    setClientRole: jest.fn(() => 0),
    enableLocalAudio: jest.fn(() => 0),
    muteLocalAudioStream: jest.fn(() => 0),
    muteAllRemoteAudioStreams: jest.fn(() => 0),
    setEnableSpeakerphone: jest.fn(() => 0),
    renewToken: jest.fn(() => 0),
    release: jest.fn(),
  };
  return {
    createAgoraRtcEngine: () => engine,
    ChannelProfileType: { ChannelProfileLiveBroadcasting: 1 },
    ClientRoleType: { ClientRoleBroadcaster: 1, ClientRoleAudience: 2 },
    AudioProfileType: { AudioProfileSpeechStandard: 1 },
    AudioScenarioType: { AudioScenarioChatroom: 5 },
    ConnectionStateType: { ConnectionStateConnected: 3, ConnectionStateFailed: 5 },
  };
});

jest.mock('@microsoft/signalr', () => {
  class HubConnectionBuilder {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    configureLogging() {
      return this;
    }
    build() {
      return { state: 'Disconnected', on: jest.fn(), onreconnecting: jest.fn(), onreconnected: jest.fn(), onclose: jest.fn(), start: jest.fn(async () => undefined), stop: jest.fn(async () => undefined), invoke: jest.fn(async () => undefined) };
    }
  }
  return {
    HubConnectionBuilder,
    HubConnectionState: { Disconnected: 'Disconnected', Connecting: 'Connecting', Connected: 'Connected', Reconnecting: 'Reconnecting' },
    HttpTransportType: { WebSockets: 1 },
    LogLevel: { Information: 2, Warning: 3 },
  };
});

jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, style }) => React.createElement(View, { style }, children),
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { Text: RNText, View } = require('react-native');
  const stub = name => {
    // SVG <Text> carries real strings, so it must render as a Text node.
    const Host = name === 'Text' ? RNText : View;
    const Component = ({ children }) => React.createElement(Host, { testID: `svg-${name}` }, children);
    Component.displayName = name;
    return Component;
  };
  return {
    __esModule: true,
    default: stub('Svg'),
    Svg: stub('Svg'),
    Path: stub('Path'),
    Circle: stub('Circle'),
    Rect: stub('Rect'),
    Ellipse: stub('Ellipse'),
    Defs: stub('Defs'),
    LinearGradient: stub('LinearGradient'),
    Stop: stub('Stop'),
    Text: stub('Text'),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, style }) => React.createElement(View, { style }, children),
    useSafeAreaInsets: () => inset,
    initialWindowMetrics: { insets: inset, frame: { x: 0, y: 0, width: 390, height: 844 } },
  };
});
