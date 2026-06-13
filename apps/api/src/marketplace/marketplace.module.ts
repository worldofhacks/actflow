import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RetryService } from '../common/retry.service';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';
import { ContractsConfigModule } from './config/config.module';
import { ContractClient } from './market.rpc.client';

@Module({
  imports: [ContractsConfigModule, UserModule, WalletModule, ConfigModule],
  providers: [ContractClient, RetryService],
  exports: [ContractClient, ContractsConfigModule],
})
export class MarketplaceModule {}
