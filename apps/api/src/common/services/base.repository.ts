import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Document, FilterQuery, Model, ObjectId, UpdateQuery } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async findIdByField(fieldName: string, value: any): Promise<ObjectId | null> {
    const result = await this.model
      .findOne({ [fieldName]: value } as FilterQuery<T>, { _id: 1 })
      .lean<{ _id: ObjectId }>()
      .exec();

    return result ? result._id : null;
  }

  async findAll(
    filter: FilterQuery<T> = {},
    options: { skip?: number; limit?: number } = {},
  ): Promise<T[]> {
    try {
      return await this.model.find(filter).skip(options.skip).limit(options.limit).exec();
    } catch (error) {
      throw new InternalServerErrorException(`Failed to find documents: ${error.message}`);
    }
  }

  async findAllPopulated<P = any>(
    filter: FilterQuery<T> = {},
    populateOptions: {
      path: string;
      model: string;
      match?: FilterQuery<P>;
    },
    options: { skip?: number; limit?: number } = {},
  ): Promise<any[]> {
    try {
      const pipeline = [];

      if (Object.keys(filter).length > 0) {
        pipeline.push({ $match: filter });
      }

      const localField = populateOptions.path.endsWith('s')
        ? `${populateOptions.path.substring(0, populateOptions.path.length - 1)}Id`
        : `${populateOptions.path}Id`;

      pipeline.push({
        $lookup: {
          from: populateOptions.model.toLowerCase() + 's',
          localField: localField,
          foreignField: '_id',
          as: populateOptions.path,
        },
      });

      const isArrayField = Array.isArray(this.model.schema.path(localField));
      if (!isArrayField) {
        pipeline.push({
          $unwind: {
            path: `$${populateOptions.path}`,
            preserveNullAndEmptyArrays: true,
          },
        });
      }

      if (populateOptions.match && Object.keys(populateOptions.match).length > 0) {
        const matchCondition: any = {};

        Object.keys(populateOptions.match).forEach(key => {
          if (isArrayField) {
            matchCondition[populateOptions.path] = {
              $elemMatch: { [key]: populateOptions.match[key] },
            };
          } else {
            matchCondition[`${populateOptions.path}.${key}`] = populateOptions.match[key];
          }
        });

        pipeline.push({ $match: matchCondition });
      }

      if (options.skip) {
        pipeline.push({ $skip: options.skip });
      }

      if (options.limit) {
        pipeline.push({ $limit: options.limit });
      }

      return this.model.aggregate(pipeline).exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to find documents with populated fields: ${error.message}`,
      );
    }
  }

  async findOne(filter: FilterQuery<T>): Promise<T> {
    try {
      const document = await this.model.findOne(filter).exec();
      if (!document) {
        throw new NotFoundException(`Document not found with filter: ${JSON.stringify(filter)}`);
      }
      return document;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding document: ${error.message}`);
    }
  }

  async findById(id: string | ObjectId): Promise<T> {
    if (!id) {
      throw new BadRequestException('ID is required');
    }

    try {
      const document = await this.model.findById(id).exec();
      if (!document) {
        throw new NotFoundException(`Document not found with ID: ${id}`);
      }
      return document;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding document by ID: ${error.message}`);
    }
  }

  async create(createDto: Partial<T>): Promise<T> {
    if (!createDto) {
      throw new BadRequestException('Creation data is required');
    }

    try {
      const entity = new this.model(createDto);

      await entity.validate();
      const savedEntity = await entity.save();
      return savedEntity;
    } catch (validationError) {
      throw new InternalServerErrorException(validationError.message);
    }
  }

  async update(id: string, updateDto: UpdateQuery<T>): Promise<T> {
    if (!id) {
      throw new BadRequestException('ID is required for update');
    }

    if (!updateDto) {
      throw new BadRequestException('Update data is required');
    }

    try {
      const updatedDocument = await this.model
        .findByIdAndUpdate(id, updateDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!updatedDocument) {
        throw new NotFoundException(`Document not found with ID: ${id}`);
      }

      return updatedDocument;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to update document: ${error.message}`);
    }
  }

  async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<boolean> {
    try {
      const result = await this.model.updateMany(filter, update).exec();
      return result.acknowledged;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update documents: ${error.message}`);
    }
  }

  async delete(objectId: string): Promise<boolean> {
    if (!objectId) {
      throw new BadRequestException('ID is required for deletion');
    }

    try {
      const result = await this.model.deleteOne({ _id: objectId }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Document not found with ID: ${objectId}`);
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete document: ${error.message}`);
    }
  }

  async deleteByKey(id: string, key: string): Promise<boolean> {
    if (!id) {
      throw new BadRequestException('ID is required for deletion');
    }

    try {
      const filter: FilterQuery<T> = { [key]: id } as FilterQuery<T>;
      const result = await this.model.deleteOne(filter).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Document not found with ID: ${id}`);
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete document: ${error.message}`);
    }
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    try {
      return await this.model.countDocuments(filter).exec();
    } catch (error) {
      throw new InternalServerErrorException(`Failed to count documents: ${error.message}`);
    }
  }

  async checkIfExists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }
}
