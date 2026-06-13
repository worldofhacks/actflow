export interface WalletGenerationResponse {
  publicKey: string;
  privateKey: string;
  autoApproved: boolean;
  name: string;
}

export interface WalletBalanceResponse {
  address: string;
  nativeBalance: string;
  tokenBalance: string;
  isWalletGenerated: boolean;
  isApprovedForMarketPlace: boolean;
}

export interface TokenAllowanceResponse {
  transactionHash: string;
}

export type PrivateKey = string;
