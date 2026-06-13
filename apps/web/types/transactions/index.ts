export interface ContractTransaction {
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
  status: string;
  eventData: Record<string, unknown>;
  processed: boolean;
}
