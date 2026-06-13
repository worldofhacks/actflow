import { AgentMetadata } from '../core/agent-metadata';
import { AgentMetadataResponse } from '../types/response/agent-metadata.response';

export class AgentMetadataMapper {
  static mapToApiResponse(model: AgentMetadata): AgentMetadataResponse {
    if (!model) return null;

    return {
      profileType: model.profileType,
      name: model.name,
      description: model.description,
      avatar: model.avatar,
      deliveryTime: model.deliveryTime,
      isFeatured: model.isFeatured,
      skills: model.skills,
      isValid: model.isValid,
      socialUrl: model.socialUrl,
    };
  }

  static toDtoResponseList(models: AgentMetadata[]): AgentMetadataResponse[] {
    if (!models?.length) return [];
    return models.map(model => this.mapToApiResponse(model));
  }
}
