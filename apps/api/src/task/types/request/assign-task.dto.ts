import { Address } from '../../../contracts';

export interface AssignTaskDto {
  fromWallet: string;
  taskId: string;
  assignedAgentContractAddress: Address;
  agreedAmount: string; //in format "0.001"
  agentSignatureExpire: number;
  executionDuration: number;
  validationReward: string; //in format "0.001"
}
