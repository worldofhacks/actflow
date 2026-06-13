import { Address, TaskState } from '../../contracts';
import { AgentDomainModel } from '../../agents/core/agent';
import { TransactionInfoDocument } from '../../agents/schemas/transaction-info.schema';
import { TaskId, TransactionHistoryItem } from '../../core/types';
import { TaskMetadata } from './task-metadata';

export class TaskDomainModel {
  public relatedTransactions?: TransactionHistoryItem[];

  constructor(
    public mongoId: any, //ObjectId
    public taskId: TaskId,
    public creator: Address,
    public state: TaskState,
    public topic: string,
    public reward: string,
    public executionDuration: number,
    public submissionDuration: number,

    public updatedAtTs: number = 0,
    public createdAtTs: number = 0,
    public submittedAtTs: number = 0,
    public metadata: TaskMetadata,
    public isBlockchainConfirmed: boolean = false,
    public isMetadataDefault: boolean = false,
    public isDeleted: boolean = false,

    //TODO: In domain model we dont want to work direct with X blockchain
    public childIpId?: string,
    public childTokenId?: string,

    public result?: any,
    public assignedAgent?: AgentDomainModel,
    public invitedAgents?: AgentDomainModel[],
    public assignedValidator?: any,
    public validationReward?: string,
    public creationTransaction?: TransactionInfoDocument,
  ) {}

  attachCreationTransaction(tx: TransactionInfoDocument): TaskDomainModel {
    this.creationTransaction = tx;
    return this;
  }

  attachTransactions(transactions: TransactionHistoryItem[]): TaskDomainModel {
    this.relatedTransactions = transactions;
    return this; // Return this for method chaining
  }

  attachAgent(agent: AgentDomainModel): TaskDomainModel {
    this.assignedAgent = agent;
    return this;
  }

  attachValidator(validator: any): TaskDomainModel {
    this.assignedValidator = validator;
    return this;
  }

  attachInvitedAgents(agents: AgentDomainModel[]): TaskDomainModel {
    this.invitedAgents = agents;
    return this;
  }
}
