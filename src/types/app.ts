export type VpnStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

export type AuthStage = 'idle' | 'opening' | 'polling' | 'error';

export interface SubscriptionInfo {
  daysLeft: number;
  trafficLeftGb: number | null;
  expiresAt: string | null;
  isActive: boolean;
  subscriptionUrl: string | null;
}

export interface UserProfile extends SubscriptionInfo {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface VpnNode {
  id: string;
  name: string;
  address: string;
  port: number;
  uuid: string;
  protocol: string;
  rawLink: string;
  countryCode: string;
  flag: string;
  sourceURL: string;
  pingMs: number | null;
  isPinned: boolean;
}

export interface AuthState {
  stage: AuthStage;
  code: string | null;
  errorMessage: string | null;
}

export interface SessionSnapshot {
  token: string;
  profile: UserProfile;
}
