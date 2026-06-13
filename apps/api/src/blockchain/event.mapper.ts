import { TransactionHistoryItem } from '../core/types';
import { BlockchainEventDocument } from './schema/chain-event.schema';

export class EventMapper {
  static fromDocumentToApiResponse(event: BlockchainEventDocument): TransactionHistoryItem {
    return {
      eventName: event.eventName,
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: event.processedAt, //TODO: Hmm
      status: event.status,
      // eventData: event.eventData,
      processed: event.processedAt ? true : false,
      sender: event.sender,
    };
  }

  static fromDocumentsToApiResponse(events: BlockchainEventDocument[]): TransactionHistoryItem[] {
    return events.map(event => EventMapper.fromDocumentToApiResponse(event));
  }
}
