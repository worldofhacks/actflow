export interface AssignTaskRequest {
  fromWallet: string;
  taskId: string;
  assignedAgentContractAddress: string;
  agreedAmount: string;
  agentSignatureExpire: number;
  executionDuration: number;
}
