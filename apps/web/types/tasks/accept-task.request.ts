export interface AcceptTaskRequest {
  fromWallet: string;
  taskId: string;
  reward: string;
  executionDuration: number;
}
