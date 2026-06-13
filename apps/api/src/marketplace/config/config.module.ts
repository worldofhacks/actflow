import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContractsConfig } from './contracts.config';

@Module({
  imports: [ConfigModule],
  providers: [ContractsConfig],
  exports: [ContractsConfig],
})
export class ContractsConfigModule {}
