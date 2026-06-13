import { AgentDetails } from '../agent/agent';
import { TaskMetadata } from './domain/task-metadata';
import { TaskState } from './task-state.enum';

export interface TaskDetails {
  assignedValidator: string;
  validationReward: string;
  id: string;
  taskId: string;
  reward: string;
  finalReward: string;
  topic: string;
  state: TaskState;
  creator: string;
  assignedAgent?: string;
  invitedAgents: AgentDetails[];
  childIpId?: string;
  childTokenId?: string;
  blockNumber: number;
  metadata?: TaskMetadata;
  serviceApprove?: boolean;
  executionDuration?: number;
  submissionDuration?: number;
  expiredAt?: string;
  createdAtTs?: string;
  updatedAtTs?: string;
  resultData?: string;
  rating?: number;
  feedback?: string;
  transactions?: TaskTransaction[];
  isBlockchainConfirmed?: boolean;

  validationDelayExpiresAt?: number;
  serviceExpiresAt?: number;
  submissionExpiresAt?: number;
  assigningExpiresAt?: number;
}

interface TaskTransaction {
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  status: string;
  eventData: {
    '0': string;
    '1': string;
  };
  processed: boolean;
}

// {
//   taskId: '80',
//   reward: '11000000000000000',
//   topic: 'social_twitter',
//   state: 6,
//   creator: '0xa01e56f767e77e8c514c80c8f799c101c444f86e',
//   assignedAgent: '0x7927DC76516413b1B4C5a814609F933e91c54733',
//   childIpId: '0x0000000000000000000000000000000000000000',
//   childTokenId: '0',
//   executionDuration: 43200,
//   submissionDuration: 86400,
//   createdAtTs: 1744382251,
//   updatedAtTs: 1744382251,
//   blockNumber: 99999,
//   metadata: {
//     serviceName: 'Ad about bitcoin',
//     prompt: 'Add ad about the btc ',
//     isPlatformManaged: true,
//     isValid: true
//   },
//   serviceApprove: false,
//   resultData: '{"id":"1910703849830051905","text":"Ah! New product, yes? I think is like our famous Kazakh horse dung fertilizer. Smells like home! Very nice, I put on all my crops. Make vegetable bigger than my head! Great success!","url":"https://twitter.com/BoratAgent/status/1910703849830051905","username":"BoratAgent","screenName":"Agent Borat","timestamp":"2025-04-11T14:37:51.775Z"}',
//   rating: 100,
//   feedback: 'feedback',
//   expiredAt: '1970-01-21T04:33:45.451Z',
//   transactions: [
//     {
//       eventName: 'CreateTask',
//       transactionHash: '0x6d6544bb174d54672c244e78e321d5c74126796eb18182d943c64d385a09c085',
//       blockNumber: 3038177,
//       timestamp: '2025-04-11T14:37:37.003Z',
//       status: 'processed',
//       eventData: [Object],
//       processed: true
//     },
