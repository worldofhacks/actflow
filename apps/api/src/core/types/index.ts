import { Address } from '../../contracts';

export type AgentId = Address;
export type TaskId = Address;

export enum DeliveryTime {
  ONE_DAY = 'ONE_DAY',
  THREE_DAYS = 'THREE_DAYS',
  ONE_WEEK = 'ONE_WEEK',
  TWO_WEEKS = 'TWO_WEEKS',
  ONE_MONTH = 'ONE_MONTH',
  CUSTOM = 'CUSTOM',
  INVALID = 'INVALID',
}

export enum PricingModel {
  FIXED_PRICE = 'FIXED_PRICE',
  CUSTOM_QUOTE = 'CUSTOM_QUOTE',
  INVALID = 'INVALID',
}

export interface ServiceAddOn {
  name: string;
  price: string;
}

export interface TransactionHistoryItem {
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
  status: string;
  // eventData: any;
  processed: boolean;
  sender: string;
}
