declare module 'react-native-config' {
  export interface NativeConfig {
    FIREBASE_FUNCTIONS_REGION?: string;
    USE_FIREBASE_EMULATOR?: string;
    FIREBASE_EMULATOR_HOST_ANDROID?: string;
    FIREBASE_EMULATOR_HOST_IOS?: string;
    APP_CHECK_ENABLED?: string;
    GOOGLE_WEB_CLIENT_ID?: string;
    GOOGLE_IOS_CLIENT_ID?: string;
    AGORA_APP_ID?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
