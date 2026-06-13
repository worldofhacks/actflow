import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WorldTrialRepository } from './repositories/world-trial.repository';
import { WorldTrial, WorldTrialSchema } from './schemas/world-trial.schema';
import { WorldConfig } from './world.config';
import { WorldController } from './world.controller';
import { WorldService } from './world.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WorldTrial.name, schema: WorldTrialSchema }]),
  ],
  controllers: [WorldController],
  providers: [
    WorldConfig,
    WorldTrialRepository,
    {
      // Construct the service with the global fetch (Node 22). Tests bypass DI and
      // construct WorldService directly with a mocked fetch — never hitting the live API.
      provide: WorldService,
      useFactory: (config: ConfigService, repo: WorldTrialRepository) =>
        new WorldService(new WorldConfig(config), repo, globalThis.fetch.bind(globalThis)),
      inject: [ConfigService, WorldTrialRepository],
    },
  ],
  exports: [WorldService],
})
export class WorldModule {}
