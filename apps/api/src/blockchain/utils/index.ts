import { ethers } from 'ethers';
import { TransactionInfoDocument } from '../../agents/schemas/transaction-info.schema';
import { BlockchainEventDocument } from '../schema/chain-event.schema';
import { BaseMQEvent } from '../types';

export function createTransactionInfo(event: BaseMQEvent): TransactionInfoDocument {
  return {
    transactionHash: event.transactionHash,
    logIndex: event.logIndex,
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    processedAt: new Date(),
  };
}

export function createTransactionInfoEvent(
  event: BlockchainEventDocument,
): TransactionInfoDocument {
  return {
    transactionHash: event.transactionHash,
    logIndex: event.logIndex,
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    processedAt: new Date(),
  };
}

export function decodeBytes32Topic(topic: string): string {
  try {
    return ethers.decodeBytes32String(topic);
  } catch (error) {
    throw new Error(`Failed to decode bytes32 topic: ${error.message}`);
  }
}
