import { StakeValidatorParams } from '../../contracts';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { RetryService } from '../../common/retry.service';
import { ContractConfigService } from '../../config/service/contract.config.service';
import { ContractsConfig } from '../../marketplace/config/contracts.config';
import { ContractClient } from '../../marketplace/market.rpc.client';
import { UserService } from '../../user/services/user.service';
import { CreateValidatorDto } from '../../validators/dtos/create-validator.dto';
import { ValidatorService } from '../../validators/service/validator.service';
import { WalletEncryptionService } from '../../wallet/wallet.encryption.service';

@Injectable()
export class FacadeValidatorService {
  constructor(
    private readonly validatorService: ValidatorService,
    private readonly encryptionService: WalletEncryptionService,
    private readonly userService: UserService,
    private readonly config: ContractsConfig,
    private readonly blockchainRetry: RetryService,
    private readonly contractConfigService: ContractConfigService,
  ) {}

  async registerValidator(userId: string, createValidatorDto: CreateValidatorDto) {
    const userPrivateKey = await this.getUserWalletPrivateKey(
      userId,
      createValidatorDto.fromWallet,
    );

    const signerClient = this.getSigner(userPrivateKey);

    const stakeAmount = (await this.contractConfigService.getLatestConfig()).validatorStakeAmount;

    const params: StakeValidatorParams = {
      metadata: createValidatorDto.metadata,
      value: ethers.parseEther(stakeAmount),
    };

    const result = await signerClient.stakeValidator(params);

    if (!result) {
      throw new Error('Failed to stake validator on blockchain');
    }

    const creationTransaction = {
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      transactionIndex: undefined,
      logIndex: undefined,
      processedAt: undefined,
    };

    const validator = await this.validatorService.createPendingValidator(
      createValidatorDto.fromWallet,
      createValidatorDto,
      creationTransaction,
      userId,
    );

    return {
      mongoId: validator._id.toString(),
      validatorId: createValidatorDto.fromWallet,
      transactionHash: result.transactionHash,
    };
  }

  private async getUserWalletPrivateKey(userId: any, walletAddress: string): Promise<string> {
    const privateKeyForWallet = await this.userService.getUserWalletPrivateKey(
      userId,
      walletAddress,
    );
    return this.encryptionService.decryptPrivateKey(privateKeyForWallet);
  }

  private getSigner(userPrivateKey: string): ContractClient {
    return ContractClient.createSigner(userPrivateKey, this.config, this.blockchainRetry);
  }
}
