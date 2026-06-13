export interface Validator {
  id: string;
  validatorId: string;
  metadata: string;
  expireAtTs: number;
  topics: string[];
  isBlockchainConfirmed: boolean;
  //   creationTransaction: TransactionInfo;
}

export interface CreatedValidatorDto {
  mongoId: string;
  validatorId: string;
  transactionHash: string;
}

export interface CreateValidatorDto {
  fromWallet: string;

  metadata: string;

  expireAtTs?: number;

  topics?: string[];
}
