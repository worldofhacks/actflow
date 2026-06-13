export interface ValidatorApiResponse {
  id: string;
  validatorId: string;
  metadata: string;
  expireAtTs: number;
  topics: string[];
  isBlockchainConfirmed: boolean;
  // creationTransaction: TransactionHistoryItem;
}

export interface ValidatorRegistrationResponse {
  mongoId: string;
  validatorId: string;
  transactionHash: string;
}
