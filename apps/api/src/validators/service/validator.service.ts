import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserService } from '../../user/services/user.service';
import { ValidatorDomainModel } from '../domain/validator';
import { CreateValidatorDto } from '../dtos/create-validator.dto';
import { ValidatorRepository } from '../repository/validator.repository';
import { ValidatorDocument } from '../schema/validator.schema';
import { ValidatorMapper } from '../validator.mapper';

@Injectable()
export class ValidatorService {
  private readonly logger = new Logger(ValidatorService.name);

  constructor(
    private readonly validatorRepository: ValidatorRepository,
    private readonly userService: UserService,
  ) {}

  async createPendingValidator(
    validatorId: string,
    data: CreateValidatorDto,
    transactionInfo: any,
    userId: string,
  ): Promise<ValidatorDocument> {
    const validator: Partial<ValidatorDocument> = {
      validatorId: validatorId,
      metadata: data.metadata,
      expireAtTs: data.expireAtTs,
      topics: data.topics || [],
      isBlockchainConfirmed: false,
      creationTransaction: transactionInfo,
      owner: userId,
    };

    return this.validatorRepository.create(validator);
  }

  async createValidatorFromBlockchain(
    validatorId: string,
    data: CreateValidatorDto,
    transactionInfo: any,
  ): Promise<ValidatorDocument> {
    this.logger.log(`Creating validator with ID: ${validatorId}`);

    const validator: Partial<ValidatorDocument> = {
      validatorId,
      metadata: data.metadata,
      expireAtTs: data.expireAtTs,
      topics: data.topics || [],
      creationTransaction: transactionInfo,
      isBlockchainConfirmed: true,
    };

    return this.validatorRepository.create(validator);
  }

  async getValidator(validatorId: string): Promise<ValidatorDocument> {
    const validator = await this.validatorRepository.findById(validatorId);
    if (!validator) {
      throw new NotFoundException(`Validator with ID ${validatorId} not found`);
    }
    return validator;
  }

  async getMyValidators(userId: string): Promise<ValidatorDomainModel[]> {
    const user = await this.userService.getUserWallets(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const userWallets = user.map(wallet => wallet.address);

    const validators = await this.validatorRepository.findAll({
      validatorId: { $in: userWallets },
    });
    return validators.map(validator => ValidatorMapper.fromDocument(validator));
  }

  async confirmValidator(
    validatorId: string,
    confirmationData: Partial<ValidatorDocument>,
  ): Promise<ValidatorDocument> {
    const validator = await this.validatorRepository.confirmValidator(
      validatorId,
      confirmationData,
    );

    if (!validator) {
      throw new NotFoundException(`Validator with ID ${validatorId} not found`);
    }

    this.logger.log(`Validator ${validatorId} confirmed on blockchain`);
    return validator;
  }

  async checkIfExists(validatorId: string): Promise<boolean> {
    return this.validatorRepository.checkIfExists({ validatorId });
  }

  async getAll(): Promise<ValidatorDocument[]> {
    return this.validatorRepository.findAll();
  }
}
