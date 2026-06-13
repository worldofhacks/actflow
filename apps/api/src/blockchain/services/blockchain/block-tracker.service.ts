import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlockTracker, BlockTrackerDocument } from '../../schema/block-tracker.schema';

@Injectable()
export class BlockTrackerService {
  private readonly logger = new Logger(BlockTrackerService.name);
  private readonly TRACKER_ID = 'default';
  private tracker: BlockTrackerDocument;
  private isProcessingHistorical = false;

  constructor(
    @InjectModel(BlockTracker.name)
    private blockTrackerModel: Model<BlockTrackerDocument>,
    private readonly configService: ConfigService,
  ) {}

  async initialize(): Promise<void> {
    this.tracker = await this.getOrCreateTracker();
    this.isProcessingHistorical = this.tracker.isProcessingHistorical;
    this.logger.log(
      `Block tracker initialized. Last processed block: ${this.tracker.lastProcessedBlock}`,
    );
  }

  private async getOrCreateTracker(): Promise<BlockTrackerDocument> {
    let tracker = await this.blockTrackerModel.findOne({ trackerId: this.TRACKER_ID }).exec();

    if (!tracker) {
      // If no tracker exists, create a new one with the deployment block from config
      const deploymentBlock = this.configService.get<number>('CONTRACT_DEPLOYMENT_BLOCK', 0);

      tracker = await this.blockTrackerModel.create({
        trackerId: this.TRACKER_ID,
        lastProcessedBlock: deploymentBlock,
        isProcessingHistorical: false,
        lastUpdated: new Date(),
      });

      this.logger.log(`Created new block tracker starting at block ${deploymentBlock}`);
    }

    return tracker;
  }

  async saveLastProcessedBlock(blockNumber: number): Promise<void> {
    if (blockNumber <= this.tracker.lastProcessedBlock) {
      return; // Don't update if the block number is not advancing
    }

    try {
      this.tracker.lastProcessedBlock = blockNumber;
      this.tracker.lastUpdated = new Date();
      await this.tracker.save();
    } catch (error) {
      this.logger.error(`Failed to save last processed block: ${error.message}`);
    }
  }

  setProcessingHistorical(value: boolean): void {
    this.isProcessingHistorical = value;
    if (this.tracker) {
      this.tracker.isProcessingHistorical = value;
      this.tracker.save().catch(error => {
        this.logger.error(`Failed to update historical processing status: ${error.message}`);
      });
    }
  }

  isHistoricalProcessing(): boolean {
    return this.isProcessingHistorical;
  }

  getLastProcessedBlock(): number {
    return this.tracker?.lastProcessedBlock || 0;
  }

  shouldProcessBlock(blockNumber: number): boolean {
    return !this.isProcessingHistorical && blockNumber > this.getLastProcessedBlock();
  }
}
