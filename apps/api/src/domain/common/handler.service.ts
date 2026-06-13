import { TaskState } from '../../contracts';
import { Injectable, Logger } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { AgentTopicMapper as AgentSkillMapper } from '../../agents/mappers/agent-topic.mapper';
import { TransactionInfoDocument } from '../../agents/schemas/transaction-info.schema';
import { AgentService } from '../../agents/services/agent.service';
import {
  enforceTaskStateTransition,
  isValidTaskTransition,
} from '../../blockchain/services/state-machine/task-state-machine';
import { ContractClient } from '../../marketplace/market.rpc.client';
import { TaskService } from '../../task/services/task.service';
import { UserService } from '../../user/services/user.service';
import { ValidatorService } from '../../validators/service/validator.service';
import { BlockchainNotificationService } from './blockchain.notification.service';
//HANDLE TRANSACTIONS HERE
@Injectable()
export class EventHandlerService {
  private readonly logger = new Logger(EventHandlerService.name);
  constructor(
    private readonly taskService: TaskService,
    private readonly agentService: AgentService,
    private readonly notificationService: BlockchainNotificationService,
    private readonly userService: UserService,
    private readonly contractClient: ContractClient,
    private readonly validatorService: ValidatorService,
  ) {}

  async completeTask(taskId: string, isHistorical = false): Promise<void> {
    const task = await this.taskService.findByTaskId(taskId);
    await enforceTaskStateTransition(
      this.taskService,
      task._id as ObjectId,
      TaskState.COMPLETED,
      isHistorical,
    );

    await this.taskService.updateTaskState(task._id as ObjectId, TaskState.COMPLETED);

    if (task.assignedAgentId) {
      const agent = await this.agentService.findById(task.assignedAgentId);
      await this.agentService.completeAgentTask(agent._id as ObjectId, task._id as ObjectId);
      await this.agentService.updateStatisticsForCompletedTask(agent._id as ObjectId, 'N/A', 100);
      if (task.creator) {
        await this.notificationService.notifyTaskCompleted(
          task.creator,
          task.assignedAgentId,
          task._id.toString(),
        );
      }
    }
  }

  async validateTask(taskId: string, isHistorical: boolean = false): Promise<void> {
    const currentTask = await this.taskService.findByTaskId(taskId);

    if (!currentTask) {
      this.logger.error(`Cannot validate task ${taskId}: Task not found`);
      return;
    }

    if (!isValidTaskTransition(currentTask.state, TaskState.VALIDATED, isHistorical)) {
      this.logger.error(
        `Invalid state transition from ${currentTask.state} to ${TaskState.VALIDATED} for task ${taskId}`,
      );

      throw new Error(
        `Invalid state transition from ${currentTask.state} to ${TaskState.VALIDATED}`,
      );
    }

    try {
      await this.taskService.updateTaskState(currentTask._id as ObjectId, TaskState.VALIDATED);

      if (currentTask.creator) {
        await this.notificationService.notifyTaskValidated(
          currentTask.creator,
          taskId,
          'validator',
          currentTask.creator,
        );
      }

      if (currentTask.assignedAgentId) {
        const agent = await this.agentService.findById(currentTask.assignedAgentId);
        if (agent?.agentId) {
          await this.notificationService.notifyTaskValidated(
            agent.agentId,
            taskId,
            'validator',
            currentTask.creator,
          );
        }
      }

      this.logger.log(`Task ${taskId} validated by a validator`);
    } catch (error) {
      this.logger.error(
        `Error updating task ${taskId} to VALIDATED state: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async declineTask(
    taskId: string,
    reason: string,
    declinedBy: 'owner' | 'validator',
    isHistorical: boolean,
  ): Promise<void> {
    const currentTask = await this.taskService.findByTaskId(taskId);

    if (!currentTask) {
      this.logger.error(`Cannot decline task ${taskId}: Task not found`);
      return;
    }

    const targetState =
      declinedBy === 'owner' ? TaskState.DECLINED_BY_OWNER : TaskState.DECLINED_BY_VALIDATOR;

    if (!isValidTaskTransition(currentTask.state, targetState, isHistorical)) {
      this.logger.error(
        `Invalid state transition from ${currentTask.state} to ${targetState} for task ${taskId}`,
      );

      if (isHistorical) {
        return;
      }

      throw new Error(`Invalid state transition from ${currentTask.state} to ${targetState}`);
    }

    try {
      await this.taskService.updateTaskDecline(currentTask._id as ObjectId, reason, targetState);
      if (declinedBy === 'owner') {
        if (currentTask.assignedAgentId) {
          const agent = await this.agentService.findById(currentTask.assignedAgentId);
          if (agent?.agentId) {
            await this.notificationService.notifyTaskDeclined(
              agent.agentId,
              taskId,
              reason,
              'owner',
            );
          }
        }
      } else {
        if (currentTask.creator) {
          await this.notificationService.notifyTaskDeclined(
            currentTask.creator,
            taskId,
            reason,
            'validator',
          );
        }

        if (currentTask.assignedAgentId) {
          const agent = await this.agentService.findById(currentTask.assignedAgentId);
          if (agent?.agentId) {
            await this.notificationService.notifyTaskDeclined(
              agent.agentId,
              taskId,
              reason,
              'validator',
            );
          }
        }
      }

      this.logger.log(`Task ${taskId} declined by ${declinedBy}: ${reason}`);
    } catch (error) {
      this.logger.error(
        `Error updating task ${taskId} decline state to ${targetState}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async expireTask(taskId: string, contractAgentId: string, taskCreator: string): Promise<void> {
    const taskMongoId = await this.taskService.findIdByTaskId(taskId);
    const agentMongoId = await this.agentService.findIdByAgentId(contractAgentId);
    await this.taskService.updateTaskState(taskMongoId, 12); //12==TaskState.EXPIRED
    await this.agentService.removeTaskFromAgent(agentMongoId, taskMongoId);
    await this.notificationService.notifyTaskExpired(taskCreator, contractAgentId, taskId);
  }

  async submitTask(
    contractTaskId: string,
    result: string,
    creator: string,
    assignedAgentId: string,
  ) {
    const taskMongoId = await this.taskService.findIdByTaskId(contractTaskId);
    await this.taskService.updateTaskState(taskMongoId, TaskState.SUBMITTED);
    await this.taskService.updateTaskResult(taskMongoId, result, result);
    await this.notificationService.notifyTaskSubmitted(creator, assignedAgentId, contractTaskId);
  }

  async processValidatorRegistration(
    validatorAddress: string,
    expireAtTs: number,
    event: any,
  ): Promise<void> {
    try {
      if (!validatorAddress) {
        throw new Error('Validator address is required');
      }

      const validatorInfo = await this.contractClient.getValidator(validatorAddress);

      const txInfo = this.createTransactionInfoEvent(event);
      const validatorAlreadyExists = await this.validatorService.checkIfExists(validatorAddress);

      if (validatorAlreadyExists) {
        await this.validatorService.confirmValidator(validatorAddress, {
          metadata: validatorInfo.metadata,
          expireAtTs,
          topics: validatorInfo.topics,
          creationTransaction: txInfo,
          isBlockchainConfirmed: true,
        });
        this.logger.log(`Validator ${validatorAddress} confirmed on blockchain`);
      } else {
        await this.validatorService.createValidatorFromBlockchain(
          validatorAddress,
          {
            metadata: validatorInfo.metadata,
            expireAtTs,
            topics: validatorInfo.topics,
            fromWallet: validatorAddress,
          },
          txInfo,
        );
        this.logger.log(`Created new validator ${validatorAddress} from blockchain event`);
      }

      // Send notification if needed
      try {
        // const user = await this.userService.findUserByAddress(validatorAddress);
        // if (user) {
        //   // await this.notificationService.notifyValidatorCreated(validatorAddress);
        // }
      } catch (error) {
        this.logger.error(`Failed to send notification: ${error.message}`);
        // Don't fail the process if notification fails
      }
    } catch (error) {
      this.logger.error(`Error processing validator registration: ${error.message}`);
      throw error;
    }
  }

  async processAgentRegistration(agentAddress: string, event: any): Promise<void> {
    try {
      if (!agentAddress) {
        throw new Error('Agent address is required');
      }

      const agentInfo = await this.contractClient.getAgent(agentAddress);
      const txInfo = this.createTransactionInfoEvent(event);

      const agentAlreadyExist = await this.agentService.checkIfExists(agentAddress);

      if (agentAlreadyExist) {
        const agent = await this.agentService.findPopulatedByAgentId(agentAddress);
        await this.agentService.confirmAgent(agent.agentId, {
          ipAssetId: agentInfo.agent?.ipAssetId,
          canNftTokenId: agentInfo.agent?.nftTokenId?.toString(),
          licenseTermsId: agentInfo.agent?.licenseTermsId?.toString(),
          creationTransaction: txInfo,
          isBlockchainConfirmed: true,
        });
        this.logger.log(`Agent ${agent.agentId} confirmed on blockchain`);
      } else {
        const skills = AgentSkillMapper.marketLibArrayToDocument(agentInfo.topics);
        await this.agentService.saveAgentFromBlockchain(agentInfo.agent, txInfo, skills);
        this.logger.log(`Created new agent ${agentInfo.agent.id} from blockchain event`);
      }

      // Send notification
      try {
        const user = await this.userService.findUserByAddress(agentAddress);
        if (user) {
          await this.notificationService.notifyAgentCreated(agentAddress);
        }
      } catch (error) {
        this.logger.error(`Failed to send notification: ${error.message}`);
        // Don't fail the process if notification fails
      }
    } catch (error) {
      this.logger.error(`Error processing agent registration: ${error.message}`);
      throw error;
    }
  }

  private createTransactionInfoEvent(event: any): any {
    return {
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      transactionIndex: event.transactionIndex,
      logIndex: event.logIndex,
      processedAt: new Date(),
    };
  }

  async processTaskCreation(
    taskId: string,
    creator: string,
    txInfo: TransactionInfoDocument,
  ): Promise<void> {
    const taskDetails = await this.contractClient.getTask(BigInt(taskId));

    const taskExisted = await this.taskService.checkIfExists(taskDetails.id.toString());

    if (taskExisted) {
      const taskId = await this.taskService.findIdByTaskId(taskDetails.id.toString());
      await this.taskService.confirmTask(taskId, taskDetails);
    } else {
      const isEmptyAgent =
        taskDetails.assignedAgent === '0x0000000000000000000000000000000000000000';
      const assignedAgentToTask = isEmptyAgent
        ? null
        : await this.agentService.findPopulatedByAgentId(taskDetails.assignedAgent);
      await this.taskService.saveTaskFromBlockchain(taskDetails, txInfo, assignedAgentToTask);
      this.logger.log(`Created new task ${taskDetails.id} from blockchain event`);
    }

    // Send notification if user exists
    try {
      const user = await this.userService.findUserByAddress(creator);
      if (user) {
        await this.notificationService.notifyTaskCreated(taskDetails.owner, taskId);
      }
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  async addInvite(taskId: string, agentId: string) {
    const taskMongoId = await this.taskService.findIdByTaskId(taskId);
    const agentMongoId = await this.agentService.findIdByAgentId(agentId);

    await this.taskService.addInvitedAgent(taskMongoId, agentMongoId);
    await this.agentService.addTaskToAgent(agentMongoId, taskMongoId, TaskState.INVITED);
  }

  async disputeTask(
    taskId: string,
    reason: string,
    disputeState: TaskState.DISPUTED_BY_OWNER | TaskState.DISPUTED_BY_AGENT,
    isHistorical: boolean,
  ): Promise<void> {
    const currentTask = await this.taskService.findByTaskId(taskId);

    if (!isValidTaskTransition(currentTask.state, disputeState, isHistorical)) {
      if (isHistorical) {
        return;
      }
      throw new Error(`Invalid state transition from ${currentTask.state} to ${disputeState}`);
    }

    await this.taskService.updateTaskDispute(currentTask._id as ObjectId, reason, disputeState);

    if (disputeState === TaskState.DISPUTED_BY_OWNER) {
      await this.notificationService.notifyTaskDisputed(
        currentTask.assignedAgentId?.toString(),
        taskId,
        reason,
        'owner',
      );
    } else {
      await this.notificationService.notifyTaskDisputed(
        currentTask.creator,
        taskId,
        reason,
        'agent',
      );
    }
  }

  async deleteTask(taskId: string, isHistorical: boolean): Promise<void> {
    const currentTask = await this.taskService.findByTaskId(taskId);

    if (!isValidTaskTransition(currentTask.state, TaskState.DELETED, isHistorical)) {
      throw new Error(`Invalid state transition from ${currentTask.state} to ${TaskState.DELETED}`);
    }

    await this.taskService.updateTaskState(currentTask._id as ObjectId, TaskState.DELETED);
  }

  async assignTaskByClient(taskId: string, agentId: string): Promise<void> {
    const taskMongoId = await this.taskService.findIdByTaskId(taskId);
    const agentMongoId = await this.agentService.findIdByAgentId(agentId);

    const currentTask = await this.taskService.findByTaskId(taskId);

    //TODO: Hm.. why we put reward here
    await this.taskService.assignTask({
      taskMongoId: taskMongoId,
      assignedAgent: agentMongoId,
      finalReward: currentTask.reward,
    });

    await this.agentService.addTaskToAgent(agentMongoId, taskMongoId, TaskState.ASSIGNED);
  }

  async assignTaskByAgent(taskId: string, agentId: string, isHistorical: boolean): Promise<void> {
    // const taskMongoId = await this.taskService.findIdByTaskId(taskId);
    const agentMongoId = await this.agentService.findIdByAgentId(agentId);

    const currentTask = await this.taskService.findByTaskId(taskId);

    if (!isValidTaskTransition(currentTask.state, TaskState.ASSIGNED, isHistorical)) {
      throw new Error(
        `Invalid state transition from ${currentTask.state} to ${TaskState.ASSIGNED}`,
      );
    }

    await this.taskService.assignTask({
      taskMongoId: currentTask._id as ObjectId,
      assignedAgent: agentMongoId,
      finalReward: currentTask.reward,
    });

    await this.agentService.addTaskToAgent(
      agentMongoId,
      currentTask._id as ObjectId,
      TaskState.ASSIGNED,
    );
  }

  async resolveTask(
    taskId: string,
    clientAmount: number,
    agentAmount: number,
    validatorAmount: number,
    isHistorical: boolean,
  ): Promise<void> {
    const currentTask = await this.taskService.findByTaskId(taskId);

    if (!isValidTaskTransition(currentTask.state, TaskState.RESOLVED, isHistorical)) {
      throw new Error(
        `Invalid state transition from ${currentTask.state} to ${TaskState.RESOLVED}`,
      );
    }

    await this.taskService.updateTaskResolution(
      currentTask._id as ObjectId,
      clientAmount.toString(),
      agentAmount.toString(),
      validatorAmount.toString(),
    );
  }
}
