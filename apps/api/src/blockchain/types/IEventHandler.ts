import { BlockchainEventDocument } from '../schema/chain-event.schema';

export interface IEventHandler {
  readonly eventName: string;
  handle(event: BlockchainEventDocument): Promise<void>;
}
