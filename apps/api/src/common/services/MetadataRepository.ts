import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
import { MetadataDocument } from './MetadataDocument';

@Injectable()
export abstract class MetadataRepository<T extends MetadataDocument> extends BaseRepository<T> {
  constructor(model: Model<T>) {
    super(model);
  }

  async findByIds(ids: string[]): Promise<T[]> {
    return this.model.find({ _id: { $in: ids } }).exec();
  }
}
