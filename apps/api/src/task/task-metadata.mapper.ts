import { TaskMetadata } from './domain/task-metadata';
import { TaskMetadataApiResponse } from './types/response/task-metadata.response';

export class TaskMetadataMapper {
  static mapToApiResponse(model: TaskMetadata): TaskMetadataApiResponse {
    if (!model) return null;

    return {
      serviceName: model.serviceName,
      prompt: model.prompt,
      isPlatformManaged: model.isPlatformManaged,
      isValid: model.isValid,
    };
  }

  static toDtoResponseList(models: TaskMetadata[]): TaskMetadataApiResponse[] {
    if (!models?.length) return [];
    return models.map(model => this.mapToApiResponse(model));
  }
}
