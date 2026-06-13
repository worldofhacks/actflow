// File: src/agents/services/agent-application.service.ts

import { NewTaskParams, TaskState } from '../../contracts';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { Types } from 'mongoose';
type ObjectId = Types.ObjectId;
import { RetryService } from '../../common/retry.service';
import { ContractsConfig } from '../../marketplace/config/contracts.config';
import { ContractClient } from '../../marketplace/market.rpc.client';
import { TaskMetadata } from '../../task/domain/task-metadata';
import { TaskService } from '../../task/services/task.service';
import { AcceptTaskDto } from '../../task/types/request/accept-task.dto';
import { AssignTaskDto } from '../../task/types/request/assign-task.dto';
import { CloseTasksDto } from '../../task/types/request/close-task.dto';

import {
  CreateTaskDto,
  isAssignedTask,
  isInviteTask,
  isOpenTask,
} from '../../task/types/request/create-task.dto';
import { DisputeTaskDto } from '../../task/types/request/dispute-task.dto';
import { SubmitResultDto } from '../../task/types/request/submit-task-result.dto';
import { ValidateTaskDto } from '../../task/types/request/validate-task.dto';
import { AssignTaskResponse } from '../../task/types/response/assign-task.response';
import { CloseTasksResponse } from '../../task/types/response/close-task.response';
import {
  CreateTaskResponse,
  SubmitTaskResultResponse,
} from '../../task/types/response/create-task.response';
import { UserService } from '../../user/services/user.service';
import { WalletEncryptionService } from '../../wallet/wallet.encryption.service';

@Injectable()
export class FacadeTaskService {
  private readonly logger = new Logger(FacadeTaskService.name);

  constructor(
    private readonly taskService: TaskService,
    private readonly config: ContractsConfig,
    private readonly blockchainRetry: RetryService,
    private readonly userService: UserService,
    private readonly encryptionService: WalletEncryptionService,
  ) {}

  private async getUserWalletPrivateKey(userId: any, walletAddress: string): Promise<string> {
    const privateKeyForWallet = await this.userService.getUserWalletPrivateKey(
      userId,
      walletAddress,
    );
    return this.encryptionService.decryptPrivateKey(privateKeyForWallet);
  }

  async registerTask(userId: string, taskData: CreateTaskDto): Promise<CreateTaskResponse> {
    const userPrivateKey = await this.getUserWalletPrivateKey(userId, taskData.fromWallet);
    const metadataModel = new TaskMetadata(taskData.payload);
    const savedMetadata = await this.taskService.saveMetadata(metadataModel);

    const rcpTaskParams = this.buildNewTaskParams(taskData, savedMetadata._id.toString());

    const signerClient = this.getSigner(userPrivateKey);

    const result = await signerClient.createTasks({ tasks: [rcpTaskParams] });
    if (!result) {
      throw new InternalServerErrorException('Failed to create task on blockchain');
    }
    const creationTransaction = {
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      transactionIndex: undefined,
      logIndex: undefined,
      processedAt: undefined,
    };
    const blockchainTaskId = result.taskIds[0].toString();

    const savedTask = await this.taskService.savePendingTask(
      {
        taskId: blockchainTaskId,
        creator: taskData.fromWallet,
        reward: taskData.reward,
        topic: taskData.topic,
        state: this.determineTaskState(taskData),
        metadataId: savedMetadata._id.toString(),
        executionDuration: taskData.executionDuration,
        submissionDuration: taskData.submissionDuration,
        assignedAgentId: isAssignedTask(taskData) ? taskData.assignedAgent : null,
        invitedAgentIds: isInviteTask(taskData) ? taskData.invitedAgents : [],
        validationReward: taskData.validationReward,
        createdTransaction: creationTransaction,
        isBlockchainConfirmed: false,
      },
      new TaskMetadata(savedMetadata),
    );

    return {
      mongoId: savedTask._id as ObjectId,
      taskId: result.taskIds[0].toString(),
      transactionHash: result.transactionHash,
    };
  }

  async submitTaskResult(
    userId: string,
    submitResultData: SubmitResultDto,
  ): Promise<SubmitTaskResultResponse> {
    const userPrivateKey = await this.getUserWalletPrivateKey(userId, submitResultData.fromWallet);

    const signerClient = this.getSigner(userPrivateKey);

    const result = await signerClient.submitTask({
      taskId: BigInt(submitResultData.taskId),
      result: submitResultData.result,
    });

    return {
      transactionHash: result.transactionHash,
    };
  }

  async assignTask(userId: string, assignTaskData: AssignTaskDto): Promise<AssignTaskResponse> {
    const userPrivateKey = await this.getUserWalletPrivateKey(userId, assignTaskData.fromWallet);

    const task = await this.getSigner(userPrivateKey).getTask(BigInt(assignTaskData.taskId));

    const reward = ethers.parseUnits(assignTaskData.agreedAmount, 18);

    const messageHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'string', 'uint32', 'uint32'],
        [
          reward,
          task.payload,
          assignTaskData.executionDuration,
          assignTaskData.agentSignatureExpire,
        ],
      ),
    );

    const wallet = new ethers.Wallet(userPrivateKey);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    const assignTaskParams = {
      taskId: BigInt(assignTaskData.taskId),
      agent: assignTaskData.assignedAgentContractAddress,
      reward: reward,
      executionDuration: assignTaskData.executionDuration,
      agentSignature: signature,
      agentSignatureExpire: assignTaskData.agentSignatureExpire,
      validationReward: assignTaskData.validationReward
        ? ethers.parseUnits(assignTaskData.validationReward, 18)
        : BigInt(0),
    };

    const signerClient = ContractClient.createSigner(
      userPrivateKey,
      this.config,
      this.blockchainRetry,
    );

    const result = await signerClient.assignTaskByClient(assignTaskParams);

    return {
      success: result.success,
      transactionHash: result.transactionHash,
    };
  }

  async closeTasks(userId: string, closeTasksData: CloseTasksDto): Promise<CloseTasksResponse> {
    const userPrivateKey = await this.getUserWalletPrivateKey(userId, closeTasksData.fromWallet);

    const closeTasksParams = {
      tasks: closeTasksData.taskIds.map(id => BigInt(id)),
      withdraw: closeTasksData.withdraw,
    };

    const signerClient = this.getSigner(userPrivateKey);

    const result = await signerClient.deleteTasks(closeTasksParams);

    return {
      success: result.success,
      transactionHash: result.transactionHash,
    };
  }

  async disputeTask(
    userId: string,
    disputeTaskData: DisputeTaskDto,
  ): Promise<{ success: boolean; transactionHash: string }> {
    const userPrivateKey = await this.getUserWalletPrivateKey(userId, disputeTaskData.fromWallet);

    const signerClient = this.getSigner(userPrivateKey);

    const result = await signerClient.disputeTask({
      taskId: BigInt(disputeTaskData.taskId),
      reason: disputeTaskData.reason,
    });

    if (!result.success) {
      throw new InternalServerErrorException('Failed to dispute task on blockchain');
    }

    return {
      success: result.success,
      transactionHash: result.transactionHash,
    };
  }

  async validateTask(
    userId: string,
    validateTaskData: ValidateTaskDto,
  ): Promise<{ success: boolean; transactionHash: string }> {
    const userPrivateKey = await this.getUserWalletPrivateKey(userId, validateTaskData.fromWallet);

    const signerClient = this.getSigner(userPrivateKey);
    const task = await this.taskService.getTaskByTaskId(validateTaskData.taskId);

    const totalValue = BigInt(task.reward) + BigInt(task.validationReward);
    const result = await signerClient.validateTask({
      taskId: BigInt(validateTaskData.taskId),
      approved: validateTaskData.approved,
      result: validateTaskData.result,
      value: totalValue,
    });

    if (!result.success) {
      throw new InternalServerErrorException('Failed to validate task on blockchain');
    }

    return {
      success: result.success,
      transactionHash: result.transactionHash,
    };
  }

  async acceptTask(userId: string, acceptTaskData: AcceptTaskDto) {
    const userPrivateKey = await this.getUserWalletPrivateKey(userId, acceptTaskData.fromWallet);

    const signerClient = this.getSigner(userPrivateKey);

    const result = await signerClient.assignTaskByAgent({
      taskId: BigInt(acceptTaskData.taskId),
      reward: ethers.parseUnits(acceptTaskData.reward, 18),
      executionDuration: acceptTaskData.executionDuration,
    });

    if (!result.success) {
      throw new InternalServerErrorException('Failed to accept task on blockchain');
    }

    return {
      success: result.success,
      transactionHash: result.transactionHash,
    };
  }

  private buildNewTaskParams(taskData: CreateTaskDto, metadataId: string): NewTaskParams {
    const baseParams = {
      state: TaskState.PENDING,
      reward: ethers.parseUnits(taskData.reward, 18),
      submissionDuration: taskData.submissionDuration || 86400,
      executionDuration: taskData.executionDuration || 43200,
      topic: taskData.topic,
      payload: metadataId,
      agentSignature: '0x',
      agentSignatureExpire: 0,
      validationReward: taskData.validationReward
        ? ethers.parseUnits(taskData.validationReward, 18)
        : BigInt(0),
    };

    if (isOpenTask(taskData)) {
      return {
        ...baseParams,
        state: TaskState.PENDING,
        agents: [],
      };
    } else if (isInviteTask(taskData)) {
      return {
        ...baseParams,
        state: TaskState.INVITED,
        agents: taskData.invitedAgents,
      };
    } else if (isAssignedTask(taskData)) {
      return {
        ...baseParams,
        state: TaskState.ASSIGNED,
        agents: [taskData.assignedAgent],
        agentSignature: taskData.agentSignature || '0x',
        agentSignatureExpire: taskData.agentSignatureExpire || 0,
      };
    }

    throw new Error('Invalid task type');
  }

  private determineTaskState(taskData: CreateTaskDto): TaskState {
    if (isAssignedTask(taskData)) {
      return TaskState.ASSIGNED;
    } else if (isInviteTask(taskData)) {
      return TaskState.INVITED;
    }
    return TaskState.PENDING;
  }

  private getSigner(userPrivateKey: string): ContractClient {
    return ContractClient.createSigner(userPrivateKey, this.config, this.blockchainRetry);
  }

  // private async fetchUrlAnalytics(socialUrl: string) {
  //   let analytics = null;
  //   try {
  //     if (socialUrl) {
  //       const urlParser = SocialUrlParser.parseAny(socialUrl);
  //       if (urlParser && urlParser.username) {
  //         const socialData = await this.ensambleService.getTwitterUserInfo(urlParser.username);
  //         if (socialData?.data?.legacy) {
  //           analytics = new SocialAnalytics({
  //             followers: socialData.data.legacy.followers_count,
  //             following: socialData.data.legacy.friends_count,
  //             totalPosts: socialData.data.legacy.statuses_count,
  //             isVerified: socialData.data.is_blue_verified,
  //             lastUpdated: new Date(),
  //           });
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     this.logger.warn(`Failed to fetch social data: ${error.message}`);
  //   }
  //   return analytics;
  // }
}
