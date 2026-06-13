import { AgentType } from './agent-type';

export interface AgentMetadata {
  profileType: AgentType;
  name: string;
  description: string;
  avatar?: string;
  isValid?: boolean;
  socialUrl?: string;
}

export interface Budget {
  min: string;
  max: string;
  currency: string;
}
