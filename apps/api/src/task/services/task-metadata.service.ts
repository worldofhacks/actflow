import { Injectable } from '@nestjs/common';
import { MetadataService } from '../../common/services/metadata.service';
import { ContractClient } from '../../marketplace/market.rpc.client';
import { TaskMetadata } from '../domain/task-metadata';
import { TaskMetadataRepository } from '../repository/task-metadata.repository';
import { TaskRepository } from '../repository/task.repository';
import { TaskMetadataDocument } from '../schemas/task-metadata.schema';

@Injectable()
export class TaskMetadataService extends MetadataService<TaskMetadata, TaskMetadataDocument> {
  constructor(
    repository: TaskMetadataRepository,
    private readonly taskRepository: TaskRepository,
    private readonly marketService: ContractClient,
  ) {
    super(repository, TaskMetadata, 'TaskMetadataService');
  }

  //TODO: REMOVE
  async resolveMetadataFromDb(taskId: string): Promise<TaskMetadata | null> {
    const task = await this.taskRepository.findPopulatedByTaskId(taskId);
    if (task?.metadata._id) {
      return this.resolveMetadata(task.metadata._id.toString());
    }
    return null;
  }

  async resolveMetadataFromChain(taskId: string): Promise<TaskMetadata | null> {
    const taskInfo = await this.marketService.getTask(BigInt(taskId));
    if (taskInfo?.payload) {
      return this.resolveMetadata(taskInfo.payload);
    }
    return null;
  }

  async getMetadataByTaskId(taskId: string): Promise<TaskMetadata> {
    try {
      const dbMetadata = await this.resolveMetadataFromDb(taskId);
      if (dbMetadata) return dbMetadata;

      const chainMetadata = await this.resolveMetadataFromChain(taskId);
      if (chainMetadata) return chainMetadata;

      this.logger.warn(`${TaskMetadataService.name}: No metadata found for task ${taskId}`);
      return TaskMetadata.default();
    } catch (error) {
      this.logger.error(`Error resolving metadata for task ${taskId}: ${error.message}`);
      return TaskMetadata.default();
    }
  }
}
