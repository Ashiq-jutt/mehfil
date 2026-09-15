declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    GOOGLE_WEB_CLIENT_ID?: string;
    GOOGLE_IOS_CLIENT_ID?: string;
    AGORA_APP_ID?: string;
    DEV_LOGIN_ENABLED?: string;
    PUSH_ENABLED?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
