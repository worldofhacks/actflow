import { Provider } from '../auth';
import { InvitationCode } from '../invitation-code';
import { WalletInfo } from './wallet';

export interface User {
  _id: string;
  name: string;
  email: string;
  roles: Role[];
  createdAt: Date | string;
  updatedAt: Date | string;
  username: string;
  active: boolean;
  provider: Provider;
  referrer?: string;
  referralCode?: string;
  referralCount: number;
  isEmailVerified: boolean;
  emailVerifiedAt: Date;
  invitationCode?: string | InvitationCode;
  linkedAccounts?: Record<
    string,
    {
      id: string;
      access_token: string;
      refresh_token: string;
      username: string;
      platform: string;
      connected_at: Date;
      interactions?: number;
    }
  >;
  walletInfo?: WalletInfo[];
}
export interface TwitterUser {
  id: string;
  name: string;
  username: string;
}
export interface GoogleUserFromPrivy {
  subject: string;
  name: string;
  email: string;
}
export type TokenAllowance = {
  transactionHash: string;
};
export type TopReferralUser = User & {
  filteredReferralCount: number;
  totalScore: number;
};
export enum Role {
  User = 'user',
  Agent = 'agent',
  Admin = 'admin',
  Validator = 'validator',
}
