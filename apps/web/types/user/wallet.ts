export interface WalletInfo {
  address: string;
  isWalletGenerated: boolean;
  _id: string;
  createdAt: Date;
  name: string;
}
export type GeneratedWallet = {
  publicKey: string;
  privateKey: string;
  name: string;
};
export interface Wallet {
  name: string;
  address: string;
  nativeBalance: string;
  tokenBalance: string;
  isWalletGenerated: boolean;
  isApprovedForMarketPlace: boolean;
  // assignedFor: 'agent' | 'validator';
}
