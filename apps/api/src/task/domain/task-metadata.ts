// src/task/types/task-metadata.ts
import { Logger } from '@nestjs/common';
import { Metadata } from '../../common/services/metadata.service';
import { PricingModel } from '../../core/types';

export class TaskMetadata implements Metadata {
  id: string;
  serviceName: string;
  prompt: string;
  pricingModel: string;
  isPlatformManaged: boolean = true;
  isValid: boolean = true;

  private readonly logger = new Logger(TaskMetadata.name);

  constructor(metadata?: Partial<TaskMetadata>) {
    this.validateAndAssign(metadata || {});
  }

  static default(overrides: Partial<TaskMetadata> = {}): TaskMetadata {
    return new TaskMetadata({
      serviceName: 'Default Service',
      prompt: 'Task metadata not available',
      pricingModel: PricingModel.FIXED_PRICE,
      isPlatformManaged: true,
      isValid: false,
      ...overrides,
    });
  }

  static fromExternalSource(uri: string, data: any): TaskMetadata {
    const metadata = new TaskMetadata({
      ...data,
      isPlatformManaged: false,
    });

    return metadata;
  }

  static isValidMetadata(data: any): boolean {
    if (!data) return false;
    if (typeof data.serviceName !== 'string' || data.serviceName.trim() === '') return false;
    if (typeof data.prompt !== 'string') return false;

    return true;
  }

  private validateAndAssign(metadata: Partial<TaskMetadata>): void {
    try {
      this.id = metadata?.id || '';
      this.serviceName = metadata?.serviceName || 'Unnamed Service';
      this.prompt = metadata?.prompt || 'No description available';
      this.pricingModel = this.validatePricingModel(metadata?.pricingModel);

      this.isPlatformManaged = metadata?.isPlatformManaged ?? true;
      this.isValid = metadata?.isValid ?? true;
    } catch (error) {
      this.logger.error(`Task metadata validation error: ${error.message}`);
      this.assignDefaultValues();
    }
  }

  private validatePricingModel(pricingModel?: string): string {
    if (pricingModel && Object.values(PricingModel).includes(pricingModel as PricingModel)) {
      return pricingModel;
    }
    if (pricingModel) {
      this.logger.warn(`Invalid pricing model: ${pricingModel}, defaulting to FIXED_PRICE`);
    }
    return PricingModel.FIXED_PRICE;
  }

  private assignDefaultValues(): void {
    this.id = new Date().toISOString(); //TODO:!!
    this.serviceName = 'Default Service';
    this.prompt = 'Task metadata not available';
    this.isPlatformManaged = true;
    this.isValid = false;
  }

  toObject(): Record<string, any> {
    return {
      serviceName: this.serviceName,
      prompt: this.prompt,
      isPlatformManaged: this.isPlatformManaged,
      isValid: this.isValid,
    };
  }
}
