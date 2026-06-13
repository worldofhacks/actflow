import { ValidatorDomainModel } from './domain/validator';
import { CreateValidatorDto } from './dtos/create-validator.dto';
import { ValidatorDocument } from './schema/validator.schema';
import { ValidatorApiResponse } from './types/response/validator.response';

export class ValidatorMapper {
  static fromDocument(document: ValidatorDocument): ValidatorDomainModel {
    return new ValidatorDomainModel(
      document._id.toString(),
      document.validatorId,
      document.metadata,
      document.expireAtTs,
      document.topics,
      document.isBlockchainConfirmed,
      document.creationTransaction,
    );
  }

  static toDomain(document: ValidatorDocument): ValidatorDomainModel {
    return this.fromDocument(document);
  }

  static toDocument(model: ValidatorDomainModel): Partial<ValidatorDocument> {
    return {
      validatorId: model.validatorId,
      metadata: model.metadata,
      expireAtTs: model.expireAtTs,
      topics: model.topics,
      isBlockchainConfirmed: model.isBlockchainConfirmed,
      creationTransaction: model.creationTransaction,
    };
  }

  static fromDto(
    dto: CreateValidatorDto,
    validatorId: string,
    transactionInfo?: any,
  ): ValidatorDomainModel {
    return new ValidatorDomainModel(
      '',
      validatorId,
      dto.metadata,
      dto.expireAtTs,
      dto.topics || [],
      false,
      transactionInfo,
    );
  }

  static toApiResponse(model: ValidatorDomainModel): ValidatorApiResponse {
    return {
      id: model.id,
      validatorId: model.validatorId,
      metadata: model.metadata,
      expireAtTs: model.expireAtTs,
      topics: model.topics,
      isBlockchainConfirmed: model.isBlockchainConfirmed,
      // creationTransaction,
    };
  }
}
