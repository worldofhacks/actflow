import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AgentDocument } from '../agents/schemas/agent.schema';
import { AgentService } from '../agents/services/agent.service';
import { TaskDocument } from '../task/schemas/task.schema';
import { TaskService } from '../task/services/task.service';
import { CreateBiddingDto } from './dto/create-bidding.dto';
import { Bidding, BiddingDocument, BiddingStatuses } from './schemas/bidding.schema';

@Injectable()
export class BiddingService {
  constructor(
    private readonly taskService: TaskService,
    private readonly agentService: AgentService,
    @InjectModel(Bidding.name) private readonly biddingModel: Model<BiddingDocument>,
  ) {}

  async create(biddingData: CreateBiddingDto) {
    const taskById = await this.taskService.getTaskByTaskId(biddingData.taskId);

    if (!taskById) {
      throw new BadRequestException('Task not found');
    }
    const agentByAddress = await this.agentService.findPopulatedByAgentId(biddingData.agentAddress);

    if (!agentByAddress) {
      throw new BadRequestException('Agent not found');
    }

    const createdBidding = new this.biddingModel({
      ...biddingData,
      taskId: taskById.mongoId,
      agentId: agentByAddress.mongoId,
    });

    await createdBidding.save();
  }

  async findAll() {
    const biddings = await this.biddingModel.aggregate([
      {
        $lookup: {
          from: 'tasks',
          localField: 'taskId',
          foreignField: '_id',
          as: 'task', //TaskDocument
        },
      },
      {
        $lookup: {
          from: 'agents',
          localField: 'agentId',
          foreignField: '_id',
          as: 'agent',
        },
      },
      {
        $unwind: '$task',
      },
      {
        $unwind: '$agent',
      },
    ]);

    return biddings;
  }

  async findOne(id: string): Promise<Bidding & { task: TaskDocument; agent: AgentDocument }> {
    const [bidding] = await this.biddingModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: 'tasks',
          localField: 'taskId',
          foreignField: '_id',
          as: 'task', //taskDocument
        },
      },
      {
        $lookup: {
          from: 'agents',
          localField: 'agentId',
          foreignField: '_id',
          as: 'agent', //agentDocument
        },
      },
      {
        $unwind: '$task',
      },
      {
        $unwind: '$agent',
      },
    ]);

    return bidding;
  }

  async updateStatusBidding(id: string, status: BiddingStatuses) {
    const updatedBidding = await this.biddingModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );

    return updatedBidding;
  }

  async acceptBid(bidId: string) {
    // const bid = await this.findOne(bidId);
    // if (!bid) {
    //   throw new BadRequestException('Bid not found');
    // }
    // const rpcParams: AssignManualTaskParams = {
    //   taskId: BigInt(bid.task.taskId),
    //   agent: bid.agentAddress,
    //   agreedAmount: BigInt(bid.amount),
    // };
    // const rpsResult = await this.marketService.assignManualTask(rpcParams);
    // if (!rpsResult?.success) {
    //   throw new BadRequestException('Error accepting bid');
    // }
    // await this.updateStatusBidding(bidId, BiddingStatuses.ACCEPTED);
    // await this.biddingModel.updateMany(
    //   {
    //     taskId: bid.taskId,
    //     _id: { $ne: bidId },
    //   },
    //   { $set: { status: 'rejected' } },
    // );
    // return 'Bid accepted';
  }

  async getBiddingByTaskId(taskId: string) {
    const objectId = new mongoose.Types.ObjectId(taskId);
    return this.biddingModel.find({ taskId: objectId });
  }

  async getBiddingByAgentId(agentId: string) {
    return this.biddingModel.find({ agentAddress: agentId });
  }

  async delete(id: string) {
    await this.biddingModel.findByIdAndDelete(id);
    return `This action removes a ${id} bidding`;
  }
}
