import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AgentModule } from './agents/agent.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BiddingModule } from './bidding/bidding.module';
import { BlockchainEventsModule } from './blockchain/blockchain.module';
import configuration, { configSchema } from './config/configuration';
import { ContractConfigModule } from './config/contract.config.module';
import { DashboardController } from './dashboard.controller';
import { DomainModule } from './domain/domain.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { NotificationModule } from './notification/notification.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { StaticDataModule } from './static/static.module';
import { TaskModule } from './task/task.module';
import { UserModule } from './user/user.module';
import { ValidatorsModule } from './validators/validator.module';
import { WalletModule } from './wallet/wallet.module';

// Dropped on monorepo import (dead/pre-pivot infrastructure): MailerModule/EmailModule,
// CookieFunModule, NativeAgentModule, PhylloModule, EnsambleModule, InvitationCodeModule,
// CampaignModule, OrderModule, TwitterModule, TicketModule, SeederModule.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: configSchema,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env.local', '.env'],
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    UserModule,
    AuthModule,
    AgentModule,
    WalletModule,
    MarketplaceModule,
    TaskModule,
    BlockchainEventsModule,
    BiddingModule,
    NotificationModule,
    StaticDataModule,
    SchedulerModule,
    ValidatorsModule,
    DomainModule,
    ContractConfigModule,
  ],
  controllers: [AppController, DashboardController],
  providers: [AppService],
})
export class AppModule {}
