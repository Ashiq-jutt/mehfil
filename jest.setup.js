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
  const { View } = require('react-native');
  const stub = name => {
    const Component = ({ children }) => React.createElement(View, { testID: `svg-${name}` }, children);
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
