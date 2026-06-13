import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MetadataRepository } from '../../common/services/MetadataRepository';
import { AgentMetadataDocument } from '../schemas/agent-metadata.schema';

@Injectable()
export class AgentMetadataRepository extends MetadataRepository<AgentMetadataDocument> {
  constructor(
    @InjectModel(AgentMetadataDocument.name)
    metadataModel: Model<AgentMetadataDocument>,
  ) {
    super(metadataModel);
  }
}
