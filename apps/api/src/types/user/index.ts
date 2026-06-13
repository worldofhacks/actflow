export interface UserFromFrontend {
  id: string;
  name: string;
  email: string;
}

export interface DecryptedToken {
  email: string;
}

export interface LinkedAccounts {
  twitter?: SocialAccountInfo | null;
  instagram?: SocialAccountInfo | null;
  google?: SocialAccountInfo | null;
  // Add other platforms as needed
}

export interface SocialAccountInfo {
  access_token: string;
  refresh_token: string;
  id: string;
  username: string;
  platform: string;
  connected_at: Date;
  interactions: number;
}
