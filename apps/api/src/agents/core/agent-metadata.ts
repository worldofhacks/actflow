import { Logger } from '@nestjs/common';
import { Metadata } from '../../common/services/metadata.service';
import { DeliveryTime } from '../../core/types';
import { AgentSkillDocument } from '../schemas/agent-metadata.schema';

export class AgentMetadata implements Metadata {
  id: string;
  name: string;
  profileType: string;
  description: string;
  avatar?: string;
  skills: AgentSkillDocument[];
  socialUrl?: string;

  deliveryTime: string;

  isPlatformManaged: boolean = true;
  isValid: boolean = false;
  isFeatured: boolean;

  private readonly logger = new Logger(AgentMetadata.name);

  constructor(metadata?: Partial<AgentMetadata>) {
    this.validateAndAssign(metadata || {});
  }

  static fromExternalSource(uri: string, data: any): AgentMetadata {
    const metadata = new AgentMetadata({
      ...data,
      isPlatformManaged: false,
    });

    return metadata;
  }
  static isValidMetadata(data: any): boolean {
    // Minimum requirements to be considered valid
    if (!data) return false;
    if (typeof data.name !== 'string' || data.name.trim() === '') return false;
    if (typeof data.description !== 'string') return false;
    if (!data.skills || !Array.isArray(data.skills)) return false;

    return true;
  }

  static default(overrides: Partial<AgentMetadata> = {}): AgentMetadata {
    return new AgentMetadata({
      profileType: 'ai_agent',
      name: 'Default Agent',
      description: 'Metadata not available',
      deliveryTime: DeliveryTime.INVALID,
      skills: [
        {
          enabled: true,
          fee: '100',
          executionDuration: 100,
          skillName: 'Post',
          autoAssign: true,
        },
      ],
      isFeatured: false,
      isPlatformManaged: true,
      isValid: false,
      ...overrides,
    });
  }

  private validateAndAssign(metadata: Partial<AgentMetadata>): void {
    try {
      this.id = metadata?.id || '';
      this.profileType = metadata?.profileType || 'ai_agent';
      this.name = metadata?.name || 'Unnamed Agent';
      this.description = metadata?.description || 'No description available';
      this.deliveryTime = this.validateDeliveryTime(metadata?.deliveryTime);
      this.isFeatured = metadata?.isFeatured || false;

      this.isPlatformManaged = metadata?.isPlatformManaged ?? true;
      this.isValid = metadata?.isValid ?? true;

      this.skills = Array.isArray(metadata?.skills) ? metadata.skills : [];

      // Optional fields - only assign if they exist
      if (metadata?.avatar) this.avatar = metadata.avatar;
      if (metadata?.socialUrl) this.socialUrl = metadata.socialUrl;
    } catch (error) {
      this.logger.error(`Metadata validation error: ${error.message}`);
      this.assignDefaultValues();
    }
  }

  private validateDeliveryTime(deliveryTime?: string): string {
    if (deliveryTime && Object.values(DeliveryTime).includes(deliveryTime as DeliveryTime)) {
      return deliveryTime;
    }
    if (deliveryTime) {
      this.logger.warn(`Invalid delivery time: ${deliveryTime}, defaulting to CUSTOM`);
    }
    return DeliveryTime.CUSTOM;
  }

  private assignDefaultValues(): void {
    this.id = new Date().toISOString(); //TODO:!!
    this.profileType = 'ai_agent';
    this.name = 'Default Agent';
    this.description = 'Metadata not available';
    this.deliveryTime = DeliveryTime.INVALID;

    this.skills = [];
    this.isFeatured = false;
    this.isPlatformManaged = true;
    this.isValid = false;
  }

  toObject(): Record<string, any> {
    return {
      profileType: this.profileType,
      name: this.name,
      description: this.description,
      deliveryTime: this.deliveryTime,
      isFeatured: this.isFeatured,
      skills: [...this.skills],
      ...(this.avatar && { avatar: this.avatar }),

      ...(this.socialUrl && { socialUrl: this.socialUrl }),
      isPlatformManaged: this.isPlatformManaged,
      isValid: this.isValid,
    };
  }
}
