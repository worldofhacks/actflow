import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from '../agents/agent.module';
import { BlockchainEventsModule } from '../blockchain/blockchain.module';
import { RetryService } from '../common/retry.service';
import { ContractConfigModule } from '../config/contract.config.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { NotificationModule } from '../notification/notification.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { ValidatorsModule } from '../validators/validator.module';
import { WalletModule } from '../wallet/wallet.module';
import { FacadeAgentService } from './agent/facade.agent.service';
import { BlockchainNotificationService } from './common/blockchain.notification.service';
import { EventHandlerService } from './common/handler.service';
import { UserTransactionsService } from './common/user-transactions.service';
import { FacadeTaskService } from './task/facade.task.service';
import { FacadeValidatorService } from './validator/facade.validator.service';
@Module({
  imports: [
    ConfigModule,
    MarketplaceModule,
    WalletModule,
    forwardRef(() => BlockchainEventsModule),
    forwardRef(() => TaskModule),
    forwardRef(() => AgentModule),
    forwardRef(() => ValidatorsModule),
    forwardRef(() => ContractConfigModule),
    NotificationModule,
    UserModule,
  ],
  providers: [
    FacadeAgentService,
    FacadeTaskService,
    EventHandlerService,
    RetryService,
    BlockchainNotificationService,
    UserTransactionsService,
    FacadeValidatorService,
  ],
  exports: [
    FacadeAgentService,
    FacadeTaskService,
    EventHandlerService,
    BlockchainNotificationService,
    FacadeValidatorService,
    UserTransactionsService,
  ],
})
export class DomainModule {}
