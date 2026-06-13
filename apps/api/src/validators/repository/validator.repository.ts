import { Validator } from '../schema/validator.schema';

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/services/base.repository';
import { ValidatorDocument } from '../schema/validator.schema';

@Injectable()
export class ValidatorRepository extends BaseRepository<ValidatorDocument> {
  private readonly logger = new Logger(ValidatorRepository.name);

  constructor(
    @InjectModel(Validator.name)
    private validatorModel: Model<ValidatorDocument>,
  ) {
    super(validatorModel);
  }

  async confirmValidator(
    validatorId: string,
    confirmationData: Partial<Validator>,
  ): Promise<ValidatorDocument | null> {
    return this.validatorModel
      .findOneAndUpdate(
        { validatorId },
        { ...confirmationData, isBlockchainConfirmed: true },
        { new: true },
      )
      .exec();
  }
}
