import { Injectable } from '@nestjs/common';
import { MetadataService } from '../../common/services/metadata.service';
import { AgentMetadata } from '../core/agent-metadata';
import { AgentMetadataRepository } from '../repository/agent-metadata.repository';
import { AgentRepository } from '../repository/agent.repository';
import { AgentMetadataDocument } from '../schemas/agent-metadata.schema';

@Injectable()
export class AgentMetadataService extends MetadataService<AgentMetadata, AgentMetadataDocument> {
  constructor(
    repository: AgentMetadataRepository,
    private readonly agentRepository: AgentRepository,
  ) {
    super(repository, AgentMetadata, 'AgentMetadataService');
  }

  async resolveMetadataFromDb(agentId: string): Promise<AgentMetadata | null> {
    const agent = await this.agentRepository.findPopulatedByAgentId(agentId);
    if (agent?.metadata) {
      return agent.metadata;
    }
    return null;
  }

  async getMetadataByAgentId(agentId: string): Promise<AgentMetadata> {
    try {
      const dbMetadata = await this.resolveMetadataFromDb(agentId);
      if (dbMetadata) return dbMetadata;

      this.logger.warn(`${AgentMetadataService.name}: No metadata found for agent ${agentId}`);
      return AgentMetadata.default();
    } catch (error) {
      this.logger.error(`Error resolving metadata for agent ${agentId}: ${error.message}`);
      return AgentMetadata.default();
    }
  }
}
