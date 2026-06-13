import { Module } from '@nestjs/common';
import { BiddingController } from './bidding.controller';
import { BiddingService } from './bidding.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Bidding, BiddingSchema } from './schemas/bidding.schema';
import { AgentModule } from '../agents/agent.module';
import { TaskModule } from '../task/task.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';

@Module({
  imports: [
    TaskModule,
    AgentModule,
    MarketplaceModule,
    MongooseModule.forFeature([{ name: Bidding.name, schema: BiddingSchema }]),
  ],
  controllers: [BiddingController],
  providers: [BiddingService],
  exports: [BiddingService],
})
export class BiddingModule {}
