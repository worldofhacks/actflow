import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockchainEventsModule } from '../blockchain/blockchain.module';
import { PinataIPFSClient } from '../common/ipfs';
import { RetryService } from '../common/retry.service';
import { FacadeAgentService } from '../domain/agent/facade.agent.service';
import { DomainModule } from '../domain/domain.module';
import { ContractsConfig } from '../marketplace/config/contracts.config';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { UserModule } from '../user/user.module';
import { WalletEncryptionService } from '../wallet/wallet.encryption.service';
import { AgentsController } from './agent.controller';
import { AgentMetadataRepository } from './repository/agent-metadata.repository';
import { AgentRepository } from './repository/agent.repository';
import { AgentMetadataDocument, AgentMetadataSchema } from './schemas/agent-metadata.schema';
import { AgentDocument, AgentSchema } from './schemas/agent.schema';
import { AgentMetadataService } from './services/agent-metadata.service';
import { AgentService } from './services/agent.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentDocument.name, schema: AgentSchema },
      { name: AgentMetadataDocument.name, schema: AgentMetadataSchema },
    ]),
    UserModule,
    MarketplaceModule,
    forwardRef(() => BlockchainEventsModule), //we using this module here just for one method (repo)
    forwardRef(() => DomainModule),
  ],
  controllers: [AgentsController],
  providers: [
    FacadeAgentService,
    AgentService,
    AgentMetadataService,
    AgentRepository,
    PinataIPFSClient,
    WalletEncryptionService,
    ContractsConfig,
    RetryService,
    AgentMetadataRepository,
  ],
  exports: [AgentService, AgentMetadataService, AgentRepository, AgentMetadataRepository],
})
export class AgentModule {}
