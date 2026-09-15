// DTOs mirror backend/src/Mehfil.Core contracts (camelCase on the wire, enums as strings).

export type Gender = 'Unspecified' | 'Male' | 'Female' | 'Undisclosed';
export type RoyalLevel = 'None' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6';
export type PrimeLevel = 'None' | 'P1' | 'P2' | 'P3';
export type UserRole = 'User' | 'Moderator' | 'Admin';

export interface UserDto {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  signature?: string | null;
  countryCode?: string | null;
  gender: Gender;
  genderLocked: boolean;
  birthDay?: number | null;
  birthMonth?: number | null;
  level: number;
  heartsBalance: number;
  heartsReceived: number;
  heartsGifted: number;
  royaltyPoints: number;
  royalLevel: RoyalLevel;
  highestRoyalLevel: RoyalLevel;
  primeLevel: PrimeLevel;
  royalStreakMonths: number;
  role: UserRole;
  createdAt: string;
}

export interface AchievementsDto {
  topGifterTimes: number;
  topReceiverTimes: number;
  celebrityOfTheMonthTimes: number;
  weeklyTopClubTimes: number;
}

export interface StatsDto {
  level: number;
  activeSeconds: number;
  clubsFollowed: number;
  clubsJoined: number;
  giftsSent: number;
  giftsReceived: number;
  profileViews: number;
}

export interface ProfileDto {
  user: UserDto;
  countryName?: string | null;
  flagEmoji?: string | null;
  achievements: AchievementsDto;
  stats: StatsDto;
}

export interface PublicProfileDto {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  signature?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  flagEmoji?: string | null;
  gender: Gender;
  level: number;
  heartsReceived: number;
  heartsGifted: number;
  royalLevel: RoyalLevel;
  primeLevel: PrimeLevel;
  isOnline: boolean;
  achievements: AchievementsDto;
  stats: StatsDto;
  createdAt: string;
}

export interface UpdateProfileRequest {
  displayName?: string | null;
  signature?: string | null;
  countryCode?: string | null;
}

export interface CountryDto {
  code: string;
  name: string;
  flagEmoji: string;
  isFeatured: boolean;
}

export interface ClubCategoryDto {
  id: number;
  code: string;
  name: string;
}

export interface RoyaltyLevelDto {
  code: string;
  rank: number;
  pointsRequired: number;
  achieved: boolean;
  achievedAt?: string | null;
}

export interface RoyaltyDto {
  points: number;
  royalLevel: RoyalLevel;
  highestRoyalLevel: RoyalLevel;
  primeLevel: PrimeLevel;
  streakMonths: number;
  nextLevelCode?: string | null;
  pointsToNextLevel?: number | null;
  royalLevels: RoyaltyLevelDto[];
  primeLevels: RoyaltyLevelDto[];
  benefits: string[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export type ClubFeed = 'Explore' | 'Hot';
export type MyClubsFilter = 'Followed' | 'Recents';
export type ClubRole = 'Member' | 'Admin' | 'Owner';

export interface ClubCardDto {
  id: string;
  name: string;
  coverUrl?: string | null;
  countryCode?: string | null;
  flagEmoji?: string | null;
  categoryCode: string;
  categoryName: string;
  level: number;
  onlineCount: number;
  memberCount: number;
  followerCount: number;
  totalHearts: number;
  isLive: boolean;
  isFollowing: boolean;
  isMine: boolean;
}

export interface ClubOwnerDto {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  level: number;
}

export interface ClubDetailDto {
  id: string;
  name: string;
  coverUrl?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  flagEmoji?: string | null;
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  language: string;
  announcement?: string | null;
  owner: ClubOwnerDto;
  adminCount: number;
  memberCount: number;
  followerCount: number;
  onlineCount: number;
  level: number;
  jarHearts: number;
  jarTarget: number;
  jarResetsAt: string;
  jarsCollected: number;
  jarsForNextLevel: number;
  totalHearts: number;
  weeklyTopClubCount: number;
  activeSeconds: number;
  isLive: boolean;
  isFollowing: boolean;
  myRole?: ClubRole | null;
  createdAt: string;
}

export interface CreateClubRequest {
  name: string;
  categoryId: number;
  countryCode?: string | null;
  language?: string | null;
  announcement?: string | null;
}

export interface UpdateClubRequest {
  name?: string | null;
  categoryId?: number | null;
  countryCode?: string | null;
  language?: string | null;
  announcement?: string | null;
}

export interface FollowResultDto {
  isFollowing: boolean;
  followerCount: number;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: UserDto;
  isNewUser: boolean;
}

export interface GoogleLoginRequest {
  idToken: string;
  deviceName?: string;
}

export interface DevLoginRequest {
  email: string;
  displayName?: string;
  deviceName?: string;
}

/** RFC 7807 problem details as produced by the backend. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}
