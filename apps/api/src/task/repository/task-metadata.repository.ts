import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MetadataRepository } from '../../common/services/MetadataRepository';
import { TaskMetadataDocument } from '../schemas/task-metadata.schema';

@Injectable()
export class TaskMetadataRepository extends MetadataRepository<TaskMetadataDocument> {
  constructor(
    @InjectModel(TaskMetadataDocument.name)
    metadataModel: Model<TaskMetadataDocument>,
  ) {
    super(metadataModel);
  }
}
