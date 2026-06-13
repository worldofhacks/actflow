import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { HireDto } from './dto/hire.dto';
import { SettleDto } from './dto/settle.dto';
import { PaymentsService } from './payments.service';
import { TaskUnlockService } from './task-unlock.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly taskUnlock: TaskUnlockService,
  ) {}

  /**
   * POST /payments/hire
   *
   * The single "unlock task" entry point. With a valid worldNullifier (free trial remaining)
   * the task is unlocked for FREE -> 200 + a method:'world-trial' receipt. Otherwise the
   * server returns HTTP 402 with a build402Challenge body in Arc USDC; the client then pays
   * via POST /payments/settle.
   */
  @Post('hire')
  async hire(@Req() req: Request, @Res() res: Response, @Body() dto: HireDto) {
    const userId = (req as any).user?._id?.toString();
    const result = await this.paymentsService.hire(
      {
        agentAddress: dto.agentAddress,
        resource: dto.resource,
        topic: dto.topic,
        price: dto.price,
        description: dto.description,
        worldNullifier: dto.worldNullifier,
        worldAction: dto.worldAction,
        userId,
      },
      this.taskUnlock.hook(),
    );

    // 402 when payment is required; 200 when a free trial unlocked the task.
    res.status(result.status).json(result);
  }

  /**
   * POST /payments/settle
   *
   * Accepts the original challenge + the signed x402 payment payload, verifies it, and on
   * success unlocks the task + writes a receipt. The `mock` flag is carried through so a
   * labeled MOCK settlement is never presented as a real on-chain payment.
   */
  @Post('settle')
  async settle(@Req() req: Request, @Body() dto: SettleDto) {
    const userId = (req as any).user?._id?.toString();
    return this.paymentsService.settle(
      {
        challenge: dto.challenge,
        payload: dto.payload,
        resource: dto.resource,
        userId,
      },
      this.taskUnlock.hook(),
    );
  }

  /**
   * GET /payments/receipts?payer=0x...&agent=0x...&limit=&offset=
   *
   * Payment history filtered by payer and/or agent (or the authenticated user). Real txs
   * include the Arc explorer URL.
   */
  @Get('receipts')
  async receipts(
    @Req() req: Request,
    @Query('payer') payer?: string,
    @Query('agent') agent?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId =
      !payer && !agent ? (req as any).user?._id?.toString() : undefined;
    return this.paymentsService.listReceipts(
      { payer, agent, userId },
      {
        limit: limit ? parseInt(limit, 10) : undefined,
        skip: offset ? parseInt(offset, 10) : undefined,
      },
    );
  }

  /** GET /payments/receipts/:id — a single receipt by id. */
  @Get('receipts/:id')
  async receipt(@Param('id') id: string) {
    return this.paymentsService.getReceipt(id);
  }
}
