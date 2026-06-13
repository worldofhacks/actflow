import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/services/base.repository';
import { ContractConfig, ContractConfigDocument } from '../schema/contract.config.schema';
@Injectable()
export class ContractConfigRepository extends BaseRepository<ContractConfigDocument> {
  constructor(@InjectModel(ContractConfig.name) private _model: Model<ContractConfigDocument>) {
    super(_model);
  }

  async findLatest(): Promise<ContractConfigDocument | null> {
    return this._model.findOne().sort({ blockNumber: -1 }).exec();
  }
}
