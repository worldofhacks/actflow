import { AgentSkillDocument } from '../../schemas/agent-metadata.schema';

export class AgentMetadataResponse {
  profileType: string;
  name: string;
  description: string;
  avatar?: string;
  deliveryTime: string;
  skills: AgentSkillDocument[];
  socialUrl?: string;

  isValid?: boolean;
  isFeatured?: boolean;
}
