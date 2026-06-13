import { Module } from '@nestjs/common';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { StaticDataController } from './static.controller';

@Module({
  imports: [MarketplaceModule],
  controllers: [StaticDataController],
})
export class StaticDataModule {}
