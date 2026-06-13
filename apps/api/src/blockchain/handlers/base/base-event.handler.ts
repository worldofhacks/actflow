import { Inject, Logger } from '@nestjs/common';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { IEventHandler } from '../../types/IEventHandler';

export abstract class BaseEventHandler implements IEventHandler {
  protected readonly logger: Logger;

  constructor(
    public readonly eventName: string,
    @Inject(BlockTrackerService) protected readonly blockTracker: BlockTrackerService,
  ) {
    this.logger = new Logger(`${eventName}Handler`);
  }

  async handle(event: BlockchainEventDocument): Promise<void> {
    try {
      this.logger.log(`${this.eventName} event`);
      const update = this.createEntityUpdate(event);
      const isHistorical = event.blockNumber < (await this.blockTracker.getLastProcessedBlock());
      await this.updateEntityState(event, update, isHistorical);
      this.logger.log(`${this.eventName} event handled`);
    } catch (error) {
      this.logger.error(`Error handling ${this.eventName} event: ${error.message}`, error.stack);
      throw error;
    }
  }

  protected abstract createEntityUpdate(event: BlockchainEventDocument): any;
  protected abstract updateEntityState(
    event: BlockchainEventDocument,
    update: any,
    isHistorical: boolean,
  ): Promise<void>;
}
