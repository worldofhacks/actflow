import { Inject } from '@nestjs/common';
import { ContractConfigService } from '../../../config/service/contract.config.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

export class SetConfigHandler extends BaseEventHandler {
  constructor(
    private readonly configService: ContractConfigService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('SetConfig', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    const { blockNumber, transactionHash, eventData } = event;

    return {
      serviceFee: parseInt(eventData[0]),
      serviceDelay: parseInt(eventData[1]),
      validationDelay: parseInt(eventData[2]),
      validatorStakeDuration: parseInt(eventData[3]),
      validatorStakeAmount: eventData[4].toString(),
      blockNumber,
      transactionHash,
    };
  }

  protected async updateEntityState(event: BlockchainEventDocument, update: any): Promise<void> {
    await this.configService.updateConfig(update);
  }
}
