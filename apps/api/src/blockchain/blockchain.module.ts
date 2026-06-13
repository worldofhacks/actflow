import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AgentModule } from '../agents/agent.module';
import { PinataIPFSClient } from '../common/ipfs';
import { RetryService } from '../common/retry.service';
import { MarketplaceModule } from '../marketplace/marketplace.module';

// Event handlers
import { SetValidTopicHandler } from './handlers/admin/set-valid-topic.handler';
import { WithdrawHandler } from './handlers/admin/withdraw.handler';
import { AgentInviteHandler } from './handlers/agent/agent-invite.handler';
import { RegisterAgentHandler } from './handlers/agent/create-agent.handler';
import { SetAgentMetadataHandler } from './handlers/agent/set-agent-metadata.handler';
import { SetAgentParamsHandler } from './handlers/agent/set-agent-params.handler';
import { SetAgentPausedHandler } from './handlers/agent/set-agent-paused.handler';
import { SetAgentTopicHandler } from './handlers/agent/set-agent-topic.handler';
import { AssignTaskByAgentHandler } from './handlers/task/assign-task-by-agent.handler';
import { AssignTaskByClientHandler } from './handlers/task/assign-task-by-client.handler';
import { CompleteTaskHandler } from './handlers/task/complete-task.handler';
import { CreateTaskHandler } from './handlers/task/create-task.handler';
import { DeclineTaskHandler } from './handlers/task/decline-task.handler';
import { DeleteTaskHandler } from './handlers/task/delete-task.handler';
import { DisputeTaskHandler } from './handlers/task/dispute-task.handler';
import { ResolveTaskHandler } from './handlers/task/resolve-task.handler';
import { SubmitTaskHandler } from './handlers/task/submit-task.handler';
import { ValidateTaskHandler } from './handlers/task/validate-task.handler';

// Schemas
import { BlockTracker, BlockTrackerSchema } from './schema/block-tracker.schema';
import { BlockchainEvent, BlockchainEventSchema } from './schema/chain-event.schema';

// Services
import { ContractConfigModule } from '../config/contract.config.module';
import { EventHandlerService } from '../domain/common/handler.service';
import { DomainModule } from '../domain/domain.module';
import { NotificationModule } from '../notification/notification.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { ValidatorService } from '../validators/service/validator.service';
import { ValidatorsModule } from '../validators/validator.module';
import { AdminService } from './handlers/admin/AdminService';
import { SetConfigHandler, StakeValidatorHandler } from './handlers/handlers';
import { BlockchainEventRepository } from './repository/events.repository';
import { BlockTrackerService } from './services/blockchain/block-tracker.service';
import { BlockchainEventService } from './services/blockchain/blockchain-event.service';
import { MarketEventService } from './services/blockchain/market-event.service';
import { EventDependencyService } from './services/processing/event-dependency.service';
import { EventHandlerProvider } from './services/processing/event-handler.provider';
import { EventHandlerRegistry } from './services/processing/event-handler.registry';
import { EventProcessorService } from './services/processing/event-processor.service';
import { WaitingEventService } from './services/processing/waiting-event.service';
@Module({
  imports: [
    MarketplaceModule,
    ScheduleModule.forRoot(),

    MongooseModule.forFeature([
      { name: BlockchainEvent.name, schema: BlockchainEventSchema },
      { name: BlockTracker.name, schema: BlockTrackerSchema },
    ]),
    UserModule, //Remove
    NotificationModule,
    forwardRef(() => AgentModule), //Remove
    forwardRef(() => TaskModule), //Remove
    forwardRef(() => DomainModule),
    forwardRef(() => ValidatorsModule),
    ContractConfigModule,
  ],
  providers: [
    // Core services
    EventHandlerService,

    BlockchainEventRepository,
    BlockchainEventService,
    BlockTrackerService,
    MarketEventService,
    EventProcessorService,
    EventDependencyService,
    WaitingEventService,
    EventHandlerRegistry,
    EventHandlerProvider,
    RetryService,
    ValidatorService,

    // Utils & Validators
    PinataIPFSClient,
    AdminService,

    // Task handlers
    CreateTaskHandler,
    AssignTaskByAgentHandler,
    AssignTaskByClientHandler,
    SubmitTaskHandler,
    CompleteTaskHandler,
    DisputeTaskHandler,
    ResolveTaskHandler,
    DeleteTaskHandler,

    // Agent handlers
    RegisterAgentHandler,
    SetAgentTopicHandler,
    SetAgentParamsHandler,
    SetAgentMetadataHandler,
    SetAgentPausedHandler,
    AgentInviteHandler,
    DeclineTaskHandler,
    ValidateTaskHandler,
    StakeValidatorHandler,

    // Admin handlers
    SetValidTopicHandler,
    WithdrawHandler,
    SetConfigHandler,
  ],
  exports: [BlockchainEventService, BlockchainEventRepository],
})
export class BlockchainEventsModule {}
