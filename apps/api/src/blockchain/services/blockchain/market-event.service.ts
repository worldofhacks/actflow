import { EVENT_SIGNATURES } from '../../../contracts';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { ContractClient } from '../../../marketplace/market.rpc.client';
import { EventProcessingStatus } from '../../schema/chain-event.schema';
import { BlockTrackerService } from './block-tracker.service';
import { BlockchainEventService } from './blockchain-event.service';

@Injectable()
export class MarketEventService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketEventService.name);
  private readonly BLOCK_BATCH_SIZE = 1000;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly POLLING_INTERVAL = 3000; // 3 seconds

  private pollingInterval: NodeJS.Timer | null = null;
  private isProcessing = false;
  private lastCheckedBlock = 0;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds

  constructor(
    private readonly marketService: ContractClient,
    private readonly blockTracker: BlockTrackerService,
    private readonly blockchainEventService: BlockchainEventService,
  ) {}

  async onModuleInit() {
    await this.initializeEventListeners();
  }

  async onModuleDestroy() {
    this.stopPolling();
  }

  private async initializeEventListeners() {
    try {
      await this.blockTracker.initialize();
      await this.processHistoricalEvents();
      await this.startBlockPolling();
      this.logger.log('Event listeners initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize event listeners:', error);
      throw error;
    }
  }

  private createEventFilter(contractAddress: string) {
    return {
      address: contractAddress,
      topics: [
        [
          ethers.id(EVENT_SIGNATURES.CREATE_TASK),
          ethers.id(EVENT_SIGNATURES.DELETE_TASK),
          ethers.id(EVENT_SIGNATURES.SUBMIT_TASK),
          ethers.id(EVENT_SIGNATURES.VALIDATE_TASK),
          ethers.id(EVENT_SIGNATURES.DECLINE_TASK),
          ethers.id(EVENT_SIGNATURES.COMPLETE_TASK),
          ethers.id(EVENT_SIGNATURES.DISPUTE_TASK),
          ethers.id(EVENT_SIGNATURES.RESOLVE_TASK),
          ethers.id(EVENT_SIGNATURES.ASSIGN_TASK_BY_AGENT),
          ethers.id(EVENT_SIGNATURES.ASSIGN_TASK_BY_CLIENT),

          // Agent events
          ethers.id(EVENT_SIGNATURES.REGISTER_AGENT),
          ethers.id(EVENT_SIGNATURES.SET_AGENT_TOPIC),
          ethers.id(EVENT_SIGNATURES.SET_AGENT_METADATA),
          ethers.id(EVENT_SIGNATURES.SET_AGENT_PAUSED),
          ethers.id(EVENT_SIGNATURES.AGENT_INVITE),
          ethers.id(EVENT_SIGNATURES.SET_VALID_TOPIC),
          ethers.id(EVENT_SIGNATURES.STAKE_VALIDATOR),

          ethers.id(EVENT_SIGNATURES.WITHDRAW),
          ethers.id(EVENT_SIGNATURES.SET_CONFIG),
        ],
      ],
    };
  }

  private async processHistoricalEvents() {
    this.blockTracker.setProcessingHistorical(true);
    try {
      const lastProcessedBlock = this.blockTracker.getLastProcessedBlock();
      const currentBlock = await this.marketService.provider.getBlockNumber();

      let fromBlock = Math.max(lastProcessedBlock, 0);
      this.lastCheckedBlock = currentBlock;

      while (fromBlock < currentBlock) {
        const toBlock = Math.min(fromBlock + this.BLOCK_BATCH_SIZE, currentBlock);
        await this.processBlockRange(fromBlock, toBlock);
        fromBlock = toBlock + 1;
        await this.blockTracker.saveLastProcessedBlock(toBlock);
      }
    } finally {
      this.blockTracker.setProcessingHistorical(false);
    }
  }

  private async processBlockRange(fromBlock: number, toBlock: number) {
    let retries = 0;
    const contractAddress = await this.marketService.getContractAddress();

    while (retries < this.MAX_RETRIES) {
      try {
        const events = await this.marketService.provider.getLogs({
          ...this.createEventFilter(contractAddress),
          fromBlock,
          toBlock,
        });

        for (const event of events) {
          await this.saveEvent(event);
        }

        this.logger.log(`Processed blocks ${fromBlock} to ${toBlock} with ${events.length} events`);
        return;
      } catch (error) {
        retries++;
        this.logger.warn(
          `Retrying block range ${fromBlock}-${toBlock} (attempt ${retries}/${this.MAX_RETRIES}): ${error.message}`,
        );
        if (retries === this.MAX_RETRIES) throw error;
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
  }

  private async saveEvent(event: ethers.Log) {
    try {
      const parsedLog = this.marketService.contract.interface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });

      if (!parsedLog) {
        this.logger.warn('Failed to parse event log:', event);
        return;
      }

      const eventName = parsedLog.name;

      let taskId: string | undefined;
      let agentAddress: string | undefined;

      const tx = await this.marketService.provider.getTransaction(event.transactionHash);

      const sender = tx?.from || ''; // The sender (transaction initiator)

      let taskOwner: string | undefined;

      // For dispute events, we need to determine the disputer relationship
      if (eventName === 'DisputeTask' || eventName === 'DeclineTask') {
        const taskIdBigInt = BigInt(parsedLog.args.taskId.toString());
        try {
          const taskDetails = await this.marketService.getTask(taskIdBigInt);
          taskOwner = taskDetails.owner;
        } catch (taskError) {
          this.logger.warn(`Couldn't fetch task data for dispute: ${taskError.message}`);
        }
      }

      switch (eventName) {
        case 'CreateTask':
          taskId = parsedLog.args.taskId.toString();
          break;
        case 'DeleteTask':
          taskId = parsedLog.args.taskId.toString();
          break;
        case 'SubmitTask':
          taskId = parsedLog.args.taskId.toString();
          break;
        case 'CompleteTask':
          taskId = parsedLog.args.taskId.toString();
          break;
        case 'DisputeTask':
          taskId = parsedLog.args.taskId.toString();
          break;
        case 'DeclineTask':
          taskId = parsedLog.args.taskId.toString();
          break;
        case 'ValidateTask':
          taskId = parsedLog.args.taskId.toString();
          break;
        case 'ResolveTask':
          taskId = parsedLog.args.taskId.toString();
          break;

        case 'RegisterAgent':
          agentAddress = parsedLog.args.agent;
          break;
        case 'SetAgentTopic':
          agentAddress = parsedLog.args.agent;
          break;
        case 'SetAgentParams':
          agentAddress = parsedLog.args.agent;
          break;
        case 'SetAgentMetadata':
          agentAddress = parsedLog.args.agent;
          break;
        case 'SetAgentPaused':
          agentAddress = parsedLog.args.agent;
          break;
        case 'AssignTaskByAgent':
          taskId = parsedLog.args.taskId.toString();
          agentAddress = parsedLog.args.agent;
          break;
        case 'AssignTaskByClient':
          taskId = parsedLog.args.taskId.toString();
          agentAddress = parsedLog.args.agent;
          break;
        case 'AgentInvite':
          agentAddress = parsedLog.args.agent;
          taskId = parsedLog.args.taskId.toString();
          break;
      }

      // Convert BigInt values to strings
      const eventData = {};
      for (const [key, value] of Object.entries(parsedLog.args)) {
        if (typeof value === 'bigint') {
          eventData[key] = value.toString();
        } else {
          eventData[key] = value;
        }
      }

      // Store the event in the database
      await this.blockchainEventService.saveEvent({
        eventName,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.index,
        transactionHash: event.transactionHash,
        eventData,
        taskId,
        agentAddress,
        status: EventProcessingStatus.UNPROCESSED,
        sender,
        taskOwner,
      });

      this.logger.debug(
        `Saved ${eventName} event: block=${event.blockNumber}, tx=${event.transactionIndex}, log=${event.index}`,
      );
    } catch (error) {
      this.logger.error(`Error saving event: ${error.message}`);
      throw error;
    }
  }

  // New real-time methods

  private async startBlockPolling() {
    this.stopPolling(); // Clear any existing interval

    try {
      // Initialize with last processed block
      this.lastCheckedBlock = this.blockTracker.getLastProcessedBlock();

      // Start polling
      this.pollingInterval = setInterval(async () => {
        if (this.isProcessing) {
          return; // Skip if already processing
        }

        try {
          this.isProcessing = true;
          await this.pollForNewBlocks();
          this.reconnectAttempts = 0; // Reset reconnect counter on success
        } catch (error) {
          this.logger.error(`Block polling error: ${error.message}`);
          await this.handlePollingError();
        } finally {
          this.isProcessing = false;
        }
      }, this.POLLING_INTERVAL);

      this.logger.log(`Started real-time block polling (interval: ${this.POLLING_INTERVAL}ms)`);
    } catch (error) {
      this.logger.error(`Failed to start block polling: ${error.message}`);
      throw error;
    }
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval as NodeJS.Timeout);
      this.pollingInterval = null;
      this.logger.log('Stopped block polling');
    }
  }

  private async pollForNewBlocks() {
    try {
      const currentBlock = await this.marketService.provider.getBlockNumber();

      // Check if there are new blocks to process
      if (currentBlock > this.lastCheckedBlock) {
        this.logger.debug(`Found new blocks: ${this.lastCheckedBlock + 1} to ${currentBlock}`);

        // Process new blocks
        await this.processBlockRange(this.lastCheckedBlock + 1, currentBlock);

        // Update state
        await this.blockTracker.saveLastProcessedBlock(currentBlock);
        this.lastCheckedBlock = currentBlock;
      }
    } catch (error) {
      throw error; // Let the outer handler deal with it
    }
  }

  private async handlePollingError() {
    this.reconnectAttempts++;

    if (this.reconnectAttempts <= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.warn(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}) in ${this.RECONNECT_DELAY}ms`,
      );

      // Stop current polling
      this.stopPolling();

      // Wait before reconnecting
      await new Promise(resolve => setTimeout(resolve, this.RECONNECT_DELAY));

      // Try to reconnect
      try {
        // Check provider connection
        await this.marketService.provider.getNetwork();

        // Restart polling if provider is responsive
        await this.startBlockPolling();
        this.logger.log('Successfully reconnected to provider');
      } catch (reconnectError) {
        this.logger.error(`Reconnection failed: ${reconnectError.message}`);

        // Try again on next polling cycle if not at max attempts
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.startBlockPolling();
        } else {
          this.logger.error('Max reconnection attempts reached. Giving up.');
        }
      }
    } else {
      this.logger.error('Max reconnection attempts reached. Manual restart required.');
    }
  }
}
