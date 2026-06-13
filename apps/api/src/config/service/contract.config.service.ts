// config/config.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ContractConfigRepository } from '../repository/config.repository';
import { ContractConfig } from '../schema/contract.config.schema';

@Injectable()
export class ContractConfigService {
  constructor(private readonly contractConfigRepository: ContractConfigRepository) {}

  async getLatestConfig(): Promise<ContractConfig> {
    const config = await this.contractConfigRepository.findLatest();
    if (!config) {
      throw new NotFoundException('Contract configuration not found');
    }
    return config;
  }

  async updateConfig(configData: {
    serviceFee: number;
    serviceDelay: number;
    validationDelay: number;
    validatorStakeDuration: number;
    validatorStakeAmount: string;
    blockNumber: number;
    transactionHash: string;
  }): Promise<ContractConfig> {
    // Always create a new config record for historical tracking
    return this.contractConfigRepository.create({
      ...configData,
      updatedAt: new Date(),
    });
  }

  async getValidationDelay(): Promise<number> {
    const config = await this.getLatestConfig();
    return config.validationDelay;
  }

  async getServiceDelay(): Promise<number> {
    const config = await this.getLatestConfig();
    return config.serviceDelay;
  }

  async getValidatorStakeDuration(): Promise<number> {
    const config = await this.getLatestConfig();
    return config.validatorStakeDuration;
  }

  async getValidatorStakeAmount(): Promise<string> {
    const config = await this.getLatestConfig();
    return config.validatorStakeAmount;
  }

  async getServiceFee(): Promise<number> {
    const config = await this.getLatestConfig();
    return config.serviceFee;
  }
}
