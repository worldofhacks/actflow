import { Injectable, Logger } from '@nestjs/common';
import { MetadataDocument } from './MetadataDocument';
import { MetadataRepository } from './MetadataRepository';

//TODO: COMPLEX, REVIEW
export interface Metadata {
  id: string;
  isPlatformManaged: boolean;
  isValid: boolean;
  toObject(): Record<string, any>;
}

export interface MetadataClass<T extends Metadata> {
  new (data?: Partial<T>): T;
  default(overrides?: Partial<T>): T;
  fromExternalSource(uri: string, data: any): T;
  isValidMetadata(data: any): boolean;
}

//TODO: COMPLEX, REVIEW
@Injectable()
export abstract class MetadataService<T extends Metadata, D extends MetadataDocument> {
  protected readonly logger: Logger;

  constructor(
    protected readonly metadataRepository: MetadataRepository<D>,
    protected readonly metadataClass: MetadataClass<T>,
    serviceName: string,
  ) {
    this.logger = new Logger(serviceName);
  }

  async saveMetadata(metadata: T): Promise<D> {
    const metadataDoc = await this.metadataRepository.create(metadata.toObject() as Partial<D>);
    return metadataDoc;
  }

  async getOrCreateById(id: string): Promise<D> {
    const defaultMetadata = this.metadataClass.default({
      isPlatformManaged: false,
      isValid: false,
    } as Partial<T>);

    const isValidMongoId = this.isValidMongoId(id);

    if (!isValidMongoId) {
      return this.metadataRepository.create(defaultMetadata.toObject() as Partial<D>) as Promise<D>;
    }

    if (isValidMongoId) {
      try {
        const doc = await this.metadataRepository.findById(id);
        if (doc) {
          return doc;
        }
      } catch (error) {
        this.logger.debug(`ID ${id} is not found as MongoDB ObjectId: ${error.message}`);
      }
    }

    this.logger.warn(`Unable to resolve metadata ID: ${id}, creating default entry`);
    return this.metadataRepository.create(defaultMetadata.toObject() as Partial<D>) as Promise<D>;
  }

  async getMetadataByIds(ids: string[]): Promise<D[]> {
    return this.metadataRepository.findByIds(ids);
  }

  async updateMetadata(id: string, metadata: Partial<T>): Promise<D | null> {
    return this.metadataRepository.update(id, metadata as any);
  }

  protected isValidMongoId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  async resolveMetadata(metadataRef: string): Promise<T> {
    try {
      const doc = await this.getOrCreateById(metadataRef);

      const plainDoc = (doc as any).toObject ? (doc as any).toObject() : doc;

      return new this.metadataClass(plainDoc);
    } catch (error) {
      this.logger.error(`Failed to resolve metadata: ${error.message}`);
      return this.metadataClass.default();
    }
  }
}
