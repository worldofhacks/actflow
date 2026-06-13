import { Inject } from '@nestjs/common';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';
import { AdminService } from './AdminService';

export class WithdrawHandler extends BaseEventHandler {
  constructor(
    private readonly financeService: AdminService, // Assuming you have a finance service
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('Withdraw', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      clientAddress: event.eventData['client'] || event.eventData[0] || '',
      amount: event.eventData['amount'] || event.eventData[1] || 0,
      feeAmount: event.eventData['feeAmount'] || event.eventData[2] || 0,
    };
  }

  protected async updateEntityState(
    event: BlockchainEventDocument,
    update: any,
    isHistorical: boolean,
  ): Promise<void> {
    // await this.financeService.recordWithdrawal(
    //   update.clientAddress,
    //   update.amount,
    //   update.feeAmount,
    // );
  }
}
