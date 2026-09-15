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

export interface ClubMemberDto {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  level: number;
  role: ClubRole;
  isOnline: boolean;
  joinedAt: string;
}

export interface ClubAdminsDto {
  max: number;
  admins: ClubMemberDto[];
}

export interface ClubRuleDto {
  title: string;
  text: string;
}

export interface UserSearchResultDto {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  level: number;
  isOnline: boolean;
}

export type ReportTargetType = 'User' | 'Club' | 'Message';
export type ReportStatus = 'Open' | 'Reviewed' | 'ActionTaken' | 'Dismissed';

export interface ReportReasonDto {
  code: string;
  label: string;
}

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string | null;
}

export interface ReportDto {
  id: number;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export type MessageType = 'Text' | 'System' | 'Gift';

export interface RoomUserDto {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  level: number;
  role: ClubRole;
  gender: Gender;
  royalLevel: RoyalLevel;
  micEnabled: boolean;
  isSpeaking: boolean;
  /** Equipped Club Store cosmetics (null = default). */
  frameCode?: string | null;
  bubbleCode?: string | null;
  entryStyleCode?: string | null;
}

export interface SeatDto {
  index: number;
  isLocked: boolean;
  isMuted: boolean;
  isOwnerSeat: boolean;
  user?: RoomUserDto | null;
}

export interface ClubMessageDto {
  id: number;
  type: MessageType;
  text: string;
  sender?: RoomUserDto | null;
  createdAt: string;
  giftTransactionId?: number | null;
}

export interface RoomClubDto {
  id: string;
  name: string;
  coverUrl?: string | null;
  level: number;
  announcement?: string | null;
  ownerId: string;
  jarHearts: number;
  jarTarget: number;
  jarResetsAt: string;
  jarsCollected: number;
  jarsForNextLevel: number;
  totalHearts: number;
  followerCount: number;
  isFollowing: boolean;
  /** Equipped room background from the Club Store (null = default scene). */
  backgroundCode?: string | null;
}

export interface RoomStateDto {
  club: RoomClubDto;
  myRole?: ClubRole | null;
  mySeatIndex?: number | null;
  onlineCount: number;
  seats: SeatDto[];
  users: RoomUserDto[];
  recentMessages: ClubMessageDto[];
}

export interface ClubBanDto {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  byUserId: string;
  reason?: string | null;
  createdAt: string;
}

export interface VoiceTokenDto {
  appId: string;
  channel: string;
  uid: number;
  token: string;
  expiresAt: string;
  canPublish: boolean;
}

export type LedgerReason = 'Purchase' | 'GiftSent' | 'Reward' | 'AdminAdjustment' | 'WelcomeBonus' | 'Refund' | 'StorePurchase';
export type PurchaseStatus = 'Pending' | 'Verified' | 'Rejected' | 'Refunded';
export type DevicePlatform = 'Android' | 'Ios';

export interface LedgerEntryDto {
  id: number;
  delta: number;
  balanceAfter: number;
  reason: LedgerReason;
  note?: string | null;
  createdAt: string;
}

export interface WalletDto {
  balance: number;
  heartsGifted: number;
  heartsReceived: number;
  royaltyPoints: number;
  ledger: PagedResult<LedgerEntryDto>;
}

export interface BonusGiftDto {
  giftCode: string;
  giftName: string;
  quantity: number;
}

export interface HeartsPackageDto {
  code: string;
  name: string;
  hearts: number;
  priceMinor: number;
  currency: string;
  royaltyPoints: number;
  iconUrl?: string | null;
  storeProductIdAndroid?: string | null;
  storeProductIdIos?: string | null;
  isBest: boolean;
  isWelcomeOffer: boolean;
  bonusGifts: BonusGiftDto[];
  isAvailable: boolean;
}

export interface ShopDto {
  balance: number;
  sandboxMode: boolean;
  packages: HeartsPackageDto[];
}

export interface VerifyPurchaseRequest {
  platform: DevicePlatform;
  productId: string;
  transactionId: string;
  receipt?: string | null;
}

export interface PurchaseResultDto {
  purchaseId: number;
  status: PurchaseStatus;
  heartsGranted: number;
  balance: number;
  royaltyPoints: number;
  royalLevel: RoyalLevel;
  primeLevel: PrimeLevel;
  alreadyProcessed: boolean;
}

export interface GiftDto {
  code: string;
  name: string;
  iconUrl: string;
  animationUrl?: string | null;
  heartsPrice: number;
}

export interface SendGiftRequest {
  giftCode: string;
  quantity: number;
  receiverId?: string | null;
}

export interface ClubLevelDto {
  level: number;
  jarHearts: number;
  jarTarget: number;
  jarResetsAt: string;
  jarsCollected: number;
  jarsForNextLevel: number;
  totalHearts: number;
}

export interface GiftEventDto {
  transactionId: number;
  sender: RoomUserDto;
  receiver?: RoomUserDto | null;
  gift: GiftDto;
  quantity: number;
  hearts: number;
  clubLevel: ClubLevelDto;
  leveledUp: boolean;
  createdAt: string;
}

export interface SendGiftResultDto {
  event: GiftEventDto;
  balance: number;
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

// ---- Leaderboards ---------------------------------------------------------

export type LeaderboardBoard = 'TopClubs' | 'TopGifters' | 'TopReceivers';
export type LeaderboardPeriod = 'Daily' | 'Weekly';
export type StoreItemKind = 'Frame' | 'ChatBubble' | 'EntryStyle' | 'Background' | 'Card' | 'ClubDp';

/** One ranked row: a club on Top Clubs, a user on Top Gifters / Top Receivers. */
export interface LeaderboardEntryDto {
  rank: number;
  id: string;
  name: string;
  imageUrl?: string | null;
  countryCode?: string | null;
  flagEmoji?: string | null;
  level: number;
  royalLevel: RoyalLevel;
  score: number;
}

export interface LeaderboardPeriodDto {
  label: string;
  start: string;
  end: string;
  totalHearts: number;
  entries: LeaderboardEntryDto[];
}

export interface LeaderboardDto {
  board: LeaderboardBoard;
  period: LeaderboardPeriod;
  previous: LeaderboardPeriodDto;
  current: LeaderboardPeriodDto;
  me?: LeaderboardEntryDto | null;
}

export interface RewardItemDto {
  code: string;
  kind: StoreItemKind;
  name: string;
  assetUrl: string;
  previewUrl?: string | null;
}

export interface RewardRankDto {
  rank: number;
  items: RewardItemDto[];
}

export interface BoardRewardsDto {
  board: LeaderboardBoard;
  ranks: RewardRankDto[];
}

export interface LeaderboardRewardsDto {
  boards: BoardRewardsDto[];
}

// ---- Club Store -----------------------------------------------------------

export type UnlockRule = 'Default' | 'Leaderboard' | 'RoyalLevel' | 'PrimeLevel' | 'ClubLevel' | 'Purchase';

export interface StoreItemDto {
  code: string;
  kind: StoreItemKind;
  name: string;
  assetUrl: string;
  previewUrl?: string | null;
  unlockRule: UnlockRule;
  unlockValue: number;
  unlockBoard?: LeaderboardBoard | null;
  unlockLabel?: string | null;
  heartsPrice?: number | null;
  /** Usable by me (won, reached the tier/level, bought, or a default). */
  isOwned: boolean;
  isEquipped: boolean;
  /** Not owned and not purchasable with hearts. */
  isLocked: boolean;
  lockReason?: string | null;
  isNew: boolean;
}

export interface StoreKindDto {
  kind: StoreItemKind;
  count: number;
  newCount: number;
}

export interface StoreDto {
  balance: number;
  clubId?: string | null;
  clubName?: string | null;
  clubLevel: number;
  highestRoyalLevel: RoyalLevel;
  primeLevel: PrimeLevel;
  kinds: StoreKindDto[];
  items: StoreItemDto[];
}

export interface EquipResultDto {
  kind: StoreItemKind;
  equippedCode?: string | null;
}

export interface BuyResultDto {
  code: string;
  balance: number;
}
