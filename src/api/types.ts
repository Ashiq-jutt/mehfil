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
