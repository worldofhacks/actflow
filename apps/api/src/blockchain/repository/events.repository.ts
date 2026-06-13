import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/services/base.repository';
import { BlockchainEvent, BlockchainEventDocument } from '../schema/chain-event.schema';

@Injectable()
export class BlockchainEventRepository extends BaseRepository<BlockchainEventDocument> {
  constructor(
    @InjectModel(BlockchainEvent.name)
    blockchainEventModel: Model<BlockchainEventDocument>,
  ) {
    super(blockchainEventModel);
  }

  //todo; use base methods (from base repo)
  async findByTaskIds(taskIds: string[]): Promise<BlockchainEventDocument[]> {
    return this.model
      .find({ taskId: { $in: taskIds } })
      .sort({ blockNumber: 1, transactionIndex: 1, logIndex: 1 })
      .exec();
  }

  async findByTaskId(taskId: string): Promise<BlockchainEventDocument[]> {
    return this.model
      .find({ taskId })
      .sort({ blockNumber: 1, transactionIndex: 1, logIndex: 1 })
      .exec();
  }

  async findByAgentAddress(agentAddress: string): Promise<BlockchainEventDocument[]> {
    return this.model
      .find({ agentAddress })
      .sort({ blockNumber: 1, transactionIndex: 1, logIndex: 1 })
      .exec();
  }

  async findBySenders(senders: string[], limit: number = 10): Promise<BlockchainEventDocument[]> {
    return this.model
      .find({ sender: { $in: senders } })
      .sort({ blockNumber: 1, transactionIndex: 1, logIndex: 1 })
      .limit(limit)
      .exec();
  }

  async findByTransactionHash(transactionHash: string): Promise<BlockchainEventDocument[]> {
    return this.model.find({ transactionHash }).sort({ logIndex: 1 }).exec();
  }
}
