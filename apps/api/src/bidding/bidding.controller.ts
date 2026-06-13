import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { BiddingService } from './bidding.service';
import { CreateBiddingDto } from './dto/create-bidding.dto';
import { BiddingStatuses } from './schemas/bidding.schema';

@Controller('bidding')
export class BiddingController {
  constructor(private readonly biddingService: BiddingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createBidding(@Body() biddingData: CreateBiddingDto) {
    await this.biddingService.create(biddingData);
  }

  @Get()
  async findAllBidding() {
    return this.biddingService.findAll();
  }

  @Get(':biddingId')
  async findOneBidding(@Param('biddingId') biddingId: string) {
    return this.biddingService.findOne(biddingId);
  }

  @Post('/reject/:biddingId')
  async updateBidding(@Param('biddingId') biddingId: string) {
    return this.biddingService.updateStatusBidding(biddingId, BiddingStatuses.REJECTED);
  }

  @Post('/accept/:bidId')
  async acceptBid(@Param('bidId') bidId: string) {
    return await this.biddingService.acceptBid(bidId);
  }

  @Get('/task/:taskId')
  async getBiddingByTaskId(@Param('taskId') taskId: string) {
    return this.biddingService.getBiddingByTaskId(taskId);
  }

  @Get('/agent/:agentId')
  async getBiddingByAgentId(@Param('agentId') agentId: string) {
    return this.biddingService.getBiddingByAgentId(agentId);
  }

  @Delete('/:biddingId')
  async deleteBidding(@Param('biddingId') biddingId: string) {
    return await this.biddingService.delete(biddingId);
  }
}
