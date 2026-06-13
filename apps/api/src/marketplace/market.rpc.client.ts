import {
  Address,
  CreateTasksResponse,
  IACTMarketRPC,
  MarketLibMarketTotals,
  MarketLibTask,
  marketplaceAbi,
  NewTaskParams,
  RegisterAgentResponse,
  SetConfigParams,
  SetValidTopicsParams,
  StakeValidatorParams,
  StakeValidatorResponse,
  StandardTxResponse,
  SubmitTaskResponse,
  TokenAmount,
  TokenId,
  TxResponse,
  UnlockBalanceResponse,
  ValidateTaskParams,
} from '../contracts';

import {
  AssignTaskByAgentParams,
  AssignTaskByClientParams,
  CreateTasksParams,
  DeleteTasksParams,
  DisputeTaskParams,
  RegisterAgentParams,
  ResolveTaskParams,
  SetAgentMetadataParams,
  SetAgentPausedParams,
  SetAgentTopicsParams,
  SubmitTaskParams,
  WithdrawParams,
} from '../contracts';
import {
  AggregateData,
  BalanceLock,
  MarketLibAgentTopic,
  MarketLibClientInfo,
  MarketLibFullAgent,
  MarketLibValidator,
  MarketLibValidatorTopic,
} from '../contracts/market.types';
import { Optional } from '@nestjs/common';

import { ethers } from 'ethers';
import { RetryService } from '../common/retry.service';
import { ContractsConfig } from './config/contracts.config';

//TODO: RETRY SERVICE ADD
export class ContractClient implements IACTMarketRPC {
  public readonly provider: ethers.Provider;
  public readonly contract: ethers.Contract;
  public readonly signer?: ethers.Signer;

  constructor(
    private config: ContractsConfig,
    private blockchainRetry: RetryService,
    @Optional() privateKey?: string,
    @Optional() testMode?: boolean,
    @Optional() contract?: ethers.Contract,
  ) {
    this.provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    // SECURITY: no implicit fallback signer. Callers that need to write must pass an
    // explicit private key (see createSigner / createAdminClient); a client constructed
    // without one is read-only. Never default to the contract-owner key here.
    this.signer = privateKey ? new ethers.Wallet(privateKey, this.provider) : undefined;
    if (testMode) {
      this.contract = contract;
      return;
    }

    this.contract = new ethers.Contract(
      config.deployment.ACT_MARKET_ADDRESS,
      marketplaceAbi,
      this.signer ?? this.provider,
    );
  }
  async setConfig(dto: SetConfigParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const tx = await this.contract.setConfig(dto);
    const txResponse = await this.processTransaction(tx);
    return {
      ...txResponse,
      success: true,
    };
  }

  async setServiceFee(serviceFee: number): Promise<StandardTxResponse> {
    this.assertSigner();
    const tx = await this.contract.setServiceFee(serviceFee);
    const txResponse = await this.processTransaction(tx);
    return {
      ...txResponse,
      success: true,
    };
  }
  getValidator(address: Address): Promise<MarketLibValidator> {
    return this.contract.validators(address);
  }
  getValidatorTopic(validator: Address, topic: string): Promise<MarketLibValidatorTopic> {
    return this.contract.validatorTopics(validator, topic);
  }

  async setServiceDelay(serviceDelay: number): Promise<StandardTxResponse> {
    this.assertSigner();
    const tx = await this.contract.setServiceDelay(serviceDelay);
    const txResponse = await this.processTransaction(tx);
    return {
      ...txResponse,
      success: true,
    };
  }
  async validateTask(dto: ValidateTaskParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const { taskId, approved, result, value } = dto;
    const tx = await this.contract.validateTask(taskId, approved, result, {
      value: value,
    });
    const txResponse = await this.processTransaction(tx);
    return {
      ...txResponse,
      success: true,
    };
  }
  async stakeValidator(dto: StakeValidatorParams): Promise<StakeValidatorResponse> {
    this.assertSigner();
    const { metadata, value } = dto;
    try {
      const tx = await this.contract.stakeValidator(metadata, {
        value: value,
      });
      const txResponse = await this.processTransaction(tx);
      return {
        ...txResponse,
        validatorId: txResponse.events['StakeValidator']?.validatorId,
        expireAtTs: txResponse.events['StakeValidator']?.expireAtTs,
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async unlockBalance(account: Address): Promise<UnlockBalanceResponse> {
    this.assertSigner();
    const tx = await this.contract.unlockBalance(account);
    const txResponse = await this.processTransaction(tx);
    return {
      ...txResponse,
      unlocked: tx,
    };
  }

  static createClientReadOnly(
    config: ContractsConfig,
    blockchainRetry: RetryService,
  ): ContractClient {
    return new ContractClient(config, blockchainRetry);
  }

  /**
   * Read-only client (no signer). Write methods throw via assertSigner().
   */
  static createClient(config: ContractsConfig, blockchainRetry: RetryService): ContractClient {
    return new ContractClient(config, blockchainRetry);
  }

  /**
   * Admin client signing with CONTRACT_OWNER_KEY. Only for explicit admin operations
   * (setConfig / setValidTopics / resolveTask); never for user-initiated actions.
   */
  static createAdminClient(
    config: ContractsConfig,
    blockchainRetry: RetryService,
  ): ContractClient {
    const ownerKey = config.contractOwnerKey;
    if (!ownerKey) {
      throw new Error('CONTRACT_OWNER_KEY is not configured; admin operations are unavailable');
    }
    return new ContractClient(config, blockchainRetry, ownerKey);
  }

  static createSigner(
    privateKey: string,
    config: ContractsConfig,
    blockchainRetry: RetryService,
  ): ContractClient {
    return new ContractClient(config, blockchainRetry, privateKey);
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, name: string): Promise<T> {
    return this.blockchainRetry.executeWithRetry(fn, name, this.config.network.rpcUrl);
  }

  private assertSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error('This operation requires a signer');
    }
    return this.signer;
  }

  private async processTransaction(tx: ethers.ContractTransactionResponse): Promise<TxResponse> {
    const receipt = await tx.wait();
    const events: Record<string, any> = {};

    if (receipt && receipt.logs) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name) {
            events[parsedLog.name] = parsedLog.args;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }
    }

    return {
      transactionHash: receipt ? receipt.hash : tx.hash,
      blockNumber: receipt ? receipt.blockNumber : 0,
      events,
    };
  }

  // ---------------------------------- TOPIC MANAGEMENT ----------------------------------

  agentTopics(agent: Address, topic: string): Promise<MarketLibAgentTopic[]> {
    return this.contract.agentTopics(agent, topic);
  }

  async getValidTopics(start: number, count: number): Promise<string[]> {
    const topics = await this.contract.getValidTopics(start, count);
    return topics.map((topic: string) => ethers.decodeBytes32String(topic));
  }

  async setValidTopics(dto: SetValidTopicsParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const { topics, state } = dto;
    const bytes32Topics = topics.map(topic => ethers.encodeBytes32String(topic));
    const tx = await this.contract.setValidTopics(bytes32Topics, state);
    const txResponse = await this.processTransaction(tx);
    return {
      ...txResponse,
      success: true,
    };
  }

  // ---------------------------------- AGENT MANAGEMENT ----------------------------------

  async getAgent(address: Address): Promise<MarketLibFullAgent> {
    const agentData = await this.contract.getAgent(address);

    if (agentData.id === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Agent not found: ${address}`);
    }

    return {
      agent: agentData.agent,
      topics: agentData.topics,
    };
  }

  async getAgentTopics(agent: Address, start: number, count: number): Promise<string[]> {
    const topics = await this.contract.getAgentTopics(agent, start, count);
    return topics.map((topic: string) => ethers.decodeBytes32String(topic));
  }

  async isAgentPaused(agentAddr: Address): Promise<boolean> {
    const agent = await this.getAgent(agentAddr);
    return agent.agent.paused;
  }

  async registerAgent(dto: RegisterAgentParams): Promise<RegisterAgentResponse> {
    this.assertSigner();
    const { metadata, topics, topicsData } = dto;

    const bytes32Topics = topics.map(topic => ethers.encodeBytes32String(topic));

    const tx = await this.contract.registerAgent(metadata, bytes32Topics, topicsData);

    const txResponse = await this.processTransaction(tx);
    const agentId = txResponse.events['RegisterAgent']?.agent || this.signer?.getAddress();

    return {
      ...txResponse,
      agentId: agentId as Address,
    };
  }

  async setAgentMetadata(dto: SetAgentMetadataParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const { metadata } = dto;

    const tx = await this.contract.setAgentMetadata(metadata);
    const txResponse = await this.processTransaction(tx);

    return {
      ...txResponse,
      success: true,
    };
  }

  async setAgentTopics(dto: SetAgentTopicsParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const { topics, topicsData } = dto;

    const bytes32Topics = topics.map(topic => ethers.encodeBytes32String(topic));
    const tx = await this.contract.setAgentTopics(bytes32Topics, topicsData);
    const txResponse = await this.processTransaction(tx);

    return {
      ...txResponse,
      success: true,
    };
  }

  async setAgentPaused(dto: SetAgentPausedParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const { agent, state } = dto;

    const tx = await this.contract.setAgentPaused(agent, state);
    const txResponse = await this.processTransaction(tx);

    return {
      ...txResponse,
      success: true,
    };
  }

  // ---------------------------------- TASK MANAGEMENT ----------------------------------

  async getTask(taskId: TokenId): Promise<MarketLibTask> {
    const taskData = await this.contract.getTask(taskId);
    return {
      id: taskId,
      reward: taskData.reward,
      owner: taskData.owner,
      assignedAgent: taskData.assignedAgent,
      topic: ethers.decodeBytes32String(taskData.topic),
      state: taskData.state,
      childTokenId: taskData.childTokenId,
      childIpId: taskData.childIpId,
      payload: taskData.payload,
      updatedAtTs: taskData.updatedAtTs,
      createdAtTs: taskData.createdAtTs,
      submissionDuration: taskData.submissionDuration,
      executionDuration: taskData.executionDuration,
      validator: taskData.validator,
      validationReward: taskData.validationReward,
    };
  }

  async tasksCounter(): Promise<TokenId> {
    return await this.contract.tasksCounter();
  }

  async createTasks(dto: CreateTasksParams): Promise<CreateTasksResponse> {
    this.assertSigner();
    const { tasks } = dto;

    const formattedTasks = tasks.map((task: NewTaskParams) => ({
      state: task.state,
      reward: task.reward,
      submissionDuration: task.submissionDuration,
      executionDuration: task.executionDuration,
      topic: ethers.encodeBytes32String(task.topic),
      payload: task.payload,
      agents: task.agents || [],
      agentSignature: task.agentSignature || '0x',
      agentSignatureExpire: task.agentSignatureExpire || 0,
      validationReward: task.validationReward,
    }));

    const totalValue = tasks.reduce(
      (sum, task) => sum + BigInt(task.reward) + BigInt(task.validationReward),
      BigInt(0),
    );

    const options = {
      value: totalValue,
    };

    const tx = await this.contract.createTasks(formattedTasks, options);
    const txResponse = await this.processTransaction(tx);

    const taskIds: TokenId[] = [];

    if (txResponse.events['CreateTask']) {
      taskIds.push(txResponse.events['CreateTask'].taskId);
    } else {
      for (const key in txResponse.events) {
        if (key.startsWith('CreateTask')) {
          taskIds.push(txResponse.events[key].taskId);
        }
      }
    }

    return {
      ...txResponse,
      taskIds,
    };
  }

  async assignTaskByClient(dto: AssignTaskByClientParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const {
      taskId,
      agent,
      reward,
      executionDuration,
      agentSignature,
      agentSignatureExpire,
      validationReward,
    } = dto;

    const tx = await this.contract.assignTaskByClient(
      taskId,
      agent,
      reward,
      executionDuration,
      agentSignature,
      agentSignatureExpire,
      validationReward,
    );

    const txResponse = await this.processTransaction(tx);
    return {
      ...txResponse,
      success: true,
    };
  }

  async assignTaskByAgent(dto: AssignTaskByAgentParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const { taskId, reward, executionDuration } = dto;

    const tx = await this.contract.assignTaskByAgent(taskId, reward, executionDuration);
    const txResponse = await this.processTransaction(tx);

    return {
      ...txResponse,
      success: true,
    };
  }

  async submitTask(dto: SubmitTaskParams): Promise<SubmitTaskResponse> {
    this.assertSigner();
    const { taskId, result } = dto;

    const tx = await this.contract.submitTask(taskId, result);
    const txResponse = await this.processTransaction(tx);

    return {
      ...txResponse,
      taskId,
      result,
    };
  }

  async disputeTask(dto: DisputeTaskParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const { taskId, reason } = dto;

    const tx = await this.contract.disputeTask(taskId, reason);
    const txResponse = await this.processTransaction(tx);

    return {
      ...txResponse,
      success: true,
    };
  }

  async resolveTask(dto: ResolveTaskParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const { taskId, clientAmount, agentAmount } = dto;

    const tx = await this.contract.resolveTask(taskId, clientAmount, agentAmount);
    const txResponse = await this.processTransaction(tx);

    return {
      ...txResponse,
      success: true,
    };
  }

  async deleteTasks(dto: DeleteTasksParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const { tasks, withdraw } = dto;

    const tx = await this.contract.closeTasks(tasks, withdraw);
    const txResponse = await this.processTransaction(tx);

    return {
      ...txResponse,
      success: true,
    };
  }

  // ---------------------------------- CLIENT INFO ----------------------------------

  async getClient(address: Address): Promise<MarketLibClientInfo> {
    const clientData = await this.contract.clients(address);
    return {
      spent: clientData.spent,
      tasksCreated: clientData.tasksCreated,
      tasksAssigned: clientData.tasksAssigned,
      tasksCompleted: clientData.tasksCompleted,
      lastActivityTs: clientData.lastActivityTs,
    };
  }

  async getClientTasksList(address: Address): Promise<TokenId[]> {
    const tasksList: TokenId[] = [];
    let index = 0;

    try {
      while (true) {
        const taskId = await this.contract.clientTasksList(address, index);
        tasksList.push(taskId);
        index++;
      }
    } catch (e) {
      // Reached the end of the list
    }

    return tasksList;
  }

  async isClientTask(client: Address, taskId: TokenId): Promise<boolean> {
    return await this.contract.clientTasks(client, taskId);
  }

  // ---------------------------------- TASK INTERACTIONS ----------------------------------

  async getTaskInvitations(taskId: TokenId): Promise<Address[]> {
    const invitations: Address[] = [];
    let index = 0;

    try {
      while (true) {
        const invitation = await this.contract.taskInvitations(taskId, index);
        invitations.push(invitation);
        index++;
      }
    } catch (e) {
      // Reached the end of the list
    }

    return invitations;
  }

  // ---------------------------------- BALANCE OPERATIONS ----------------------------------

  async aggregate(account: Address): Promise<AggregateData> {
    const data = await this.contract.aggregate(account);
    return {
      balance: data.balance,
      locked: data.locked,
      nativeBalance: data.nativeBalance,
      rvTokenBalance: data.rvTokenBalance,
    };
  }

  async balances(account: Address): Promise<TokenAmount> {
    return await this.contract.balances(account);
  }

  async balanceLocks(account: Address, index: number): Promise<BalanceLock> {
    const lock = await this.contract.balanceLocks(account, index);
    return {
      taskId: lock.taskId,
      unlockTs: lock.unlockTs,
      amount: lock.amount,
    };
  }

  async lockedBalance(account: Address): Promise<TokenAmount> {
    return await this.contract.lockedBalance(account);
  }

  async lockedBalanceByTask(account: Address, taskId: TokenId): Promise<TokenAmount> {
    return await this.contract.lockedBalanceByTask(account, taskId);
  }

  async withdraw(dto: WithdrawParams): Promise<StandardTxResponse> {
    this.assertSigner();
    const { amount } = dto;

    const tx = await this.contract.withdraw(amount);
    const txResponse = await this.processTransaction(tx);

    return {
      ...txResponse,
      success: true,
    };
  }

  // ---------------------------------- MARKET STATISTICS ----------------------------------

  async marketTotals(): Promise<MarketLibMarketTotals> {
    throw new Error('Method not implemented: marketTotals');
    // This method is not directly available in the contract
    // You may need to implement a custom logic to calculate market totals
  }

  // ---------------------------------- CONTRACT INFORMATION ----------------------------------

  serviceFee(): Promise<number> {
    return this.contract.serviceFee();
  }

  async serviceDelay(): Promise<number> {
    const delay = await this.contract.serviceDelay();
    return Number(delay);
  }

  async validatorStakeDuration(): Promise<number> {
    const duration = await this.contract.validatorStakeDuration();
    return Number(duration);
  }

  validatorStakeAmount(): Promise<TokenAmount> {
    return this.contract.validatorStakeAmount();
  }
  async validationDelay(): Promise<number> {
    const delay = await this.contract.validationDelay();
    return Number(delay);
  }

  feeBasis(): Promise<number> {
    return this.contract.feeBasis();
  }

  async getContractAddress(): Promise<string> {
    return await this.contract.getAddress();
  }

  async AGENT_NFT(): Promise<Address> {
    return await this.contract.AGENT_NFT();
  }

  async REVENUE_TOKEN(): Promise<Address> {
    return await this.contract.REVENUE_TOKEN();
  }

  async IP_ASSET_REGISTRY(): Promise<Address> {
    return await this.contract.IP_ASSET_REGISTRY();
  }

  async LICENSING_MODULE(): Promise<Address> {
    return await this.contract.LICENSING_MODULE();
  }

  async PIL_TEMPLATE(): Promise<Address> {
    return await this.contract.PIL_TEMPLATE();
  }

  async ROYALTY_POLICY_LAP(): Promise<Address> {
    return await this.contract.ROYALTY_POLICY_LAP();
  }

  async ROYALTY_WORKFLOWS(): Promise<Address> {
    return await this.contract.ROYALTY_WORKFLOWS();
  }

  async ROYALTY_MODULE(): Promise<Address> {
    return await this.contract.ROYALTY_MODULE();
  }

  // ---------------------------------- CONTRACT METADATA ----------------------------------

  async isPaused(): Promise<boolean> {
    try {
      return await this.contract.paused();
    } catch {
      return false;
    }
  }

  async owner(): Promise<Address> {
    return await this.contract.owner();
  }
}
