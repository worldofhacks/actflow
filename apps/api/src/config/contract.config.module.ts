// config/config.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractConfigController } from './config.controller';
import { ContractConfigRepository } from './repository/config.repository';
import { ContractConfig, ContractConfigSchema } from './schema/contract.config.schema';
import { ContractConfigService } from './service/contract.config.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ContractConfig.name, schema: ContractConfigSchema }]),
  ],
  controllers: [ContractConfigController],
  providers: [ContractConfigService, ContractConfigRepository],
  exports: [ContractConfigService, ContractConfigRepository],
})
export class ContractConfigModule {}
