import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  ClubsHome: undefined;
  Profile: undefined;
  ClubInfo: { publicId: string };
  ClubRoom: { publicId: string };
  CreateClub: { publicId?: string } | undefined;
};

export type ClubsTabParamList = {
  Explore: undefined;
  Hot: undefined;
  My: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>;
