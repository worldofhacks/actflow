export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  resetPasswordToken: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AccessTokenResponse {
  access_token: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}
export interface Provider {
  type: ProviderType;
  /**
   * will be available only for @type {ProviderType.GOOGLE}
   */
  image?: string;
  /**
   * will be available only for @type {ProviderType.WALLET} will be the wallet address, and this address will be hashed so be careful while updating and reading
   */
  address?: string;
  /**
   * will be available for some of the providers like @type {ProviderType.GOOGLE, ProviderType.TWITTER, ProviderType.TELEGRAM}
   */
  access_token?: string;
}
export enum ProviderType {
  GOOGLE = 'google',
  CREDENTIALS = 'credentials',
  TWITTER = 'twitter',
  WALLET = 'wallet',
  TELEGRAM = 'telegram',
  GOOGLE_LOGIN_WITH_PRIVY = 'googleLoginWithPrivy',
  TWITTER_LOGIN_WITH_PRIVY = 'twitterLoginWithPrivy',
}
