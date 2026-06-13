import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  FilterQuery,
  Model,
  PipelineStage,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { BaseRepository } from '../../common/services/base.repository';
import { UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(@InjectModel(UserDocument.name) userModel: Model<UserDocument>) {
    super(userModel);
  }

  /**
   * Find one user with optional field selection
   */
  async findOne(
    filter: FilterQuery<UserDocument>,
    projection?: string,
  ): Promise<UserDocument | null> {
    const query = this.model.findOne(filter);
    if (projection) {
      query.select(projection);
    }
    return query.exec();
  }

  /**
   * Update one user and return the updated document
   */
  async findOneAndUpdate(
    filter: FilterQuery<UserDocument>,
    update: UpdateQuery<UserDocument>,
    options: QueryOptions = { new: true },
  ): Promise<UserDocument | null> {
    return this.model.findOneAndUpdate(filter, update, options).exec();
  }

  /**
   * Find by ID and update
   */
  async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<UserDocument>,
    options: QueryOptions = { new: true },
  ): Promise<UserDocument | null> {
    return this.model.findByIdAndUpdate(id, update, options).exec();
  }

  /**
   * Start a database session
   */
  async startSession(): Promise<ClientSession> {
    return this.model.db.startSession();
  }

  /**
   * Find by ID query
   * @param id
   * @returns returns the result for object channing
   */
  findByIdQuery(id: string) {
    return this.model.findById(id);
  }

  /**
   * Execute an aggregation pipeline
   */
  async aggregate(pipeline: PipelineStage[]): Promise<any[]> {
    return this.model.aggregate(pipeline).exec();
  }
}
