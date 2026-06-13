import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockchainEventsModule } from '../blockchain/blockchain.module';
import { PinataIPFSClient } from '../common/ipfs';
import { RetryService } from '../common/retry.service';
import { ContractConfigModule } from '../config/contract.config.module';
import { DomainModule } from '../domain/domain.module';
import { ContractsConfig } from '../marketplace/config/contracts.config';
import { ContractClient } from '../marketplace/market.rpc.client';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';
import { WorldModule } from '../world/world.module';
import { TaskMetadataRepository } from './repository/task-metadata.repository';
import { TaskRepository } from './repository/task.repository';
import { TaskMetadataDocument, TaskMetadataSchema } from './schemas/task-metadata.schema';
import { TaskDocument, TaskSchema } from './schemas/task.schema';
import { TaskMetadataService } from './services/task-metadata.service';
import { TaskService } from './services/task.service';
import { TaskMetadataMapper } from './task-metadata.mapper';
import { TaskController } from './task.controller';
import { TaskMapper } from './task.mapper';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskDocument.name, schema: TaskSchema },
      { name: TaskMetadataDocument.name, schema: TaskMetadataSchema },
    ]),
    MarketplaceModule,
    UserModule,
    WalletModule,
    forwardRef(() => BlockchainEventsModule), //we using this module here just for one method (repo)
    forwardRef(() => DomainModule),
    ContractConfigModule,
    // World ID free-trial gate: makes WorldService available to the task flow so a free
    // task can consume a proof-of-human trial instead of requiring payment.
    WorldModule,
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    PinataIPFSClient,
    TaskRepository,
    ContractsConfig,
    TaskMetadataRepository,
    TaskMetadataService,
    RetryService,
    TaskMapper,
    TaskMetadataMapper,
    ContractClient,
  ],
  exports: [
    TaskService,
    TaskRepository,
    TaskMetadataRepository,
    TaskMetadataService,
    TaskMapper,
    TaskMetadataMapper,
  ],
})
export class TaskModule {}
