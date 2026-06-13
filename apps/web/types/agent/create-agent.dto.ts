import { AgentType } from './agent-type';

export interface AgentPayloadDto {
  socialUrl: string;
  name: string;
  description: string;
  profileType: AgentType;
}

export interface AgentTopicDto {
  skillName: string;
  enabled: boolean;
  fee: string;
  executionDuration: string;
  autoAssign: boolean;
}

export interface CreateAgentDto {
  fromWallet: string;
  topic: string;
  skills: AgentTopicDto[];

  metadata: AgentPayloadDto;
}
