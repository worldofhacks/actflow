import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { VerifyWorldDto } from './dto/verify-world.dto';
import { WorldService } from './world.service';

@Controller('world')
export class WorldController {
  constructor(private readonly worldService: WorldService) {}

  /**
   * POST /world/verify
   *
   * Body = the IDKit result payload (forwarded as-is), optionally wrapped as
   * { payload, action } and/or with the IDKit fields at the top level. The proof itself is
   * the credential (no JWT required), but if an authenticated user id is present we link it.
   *
   * Server-side: verifies the ZK proof at the World cloud endpoint, then credits a brand-new
   * human (default 3 free trials) or returns the current remaining for a known human.
   */
  @Post('verify')
  async verify(@Req() req: Request, @Body() dto: VerifyWorldDto) {
    // Forward the IDKit payload AS-IS. Accept either { payload, action } or the IDKit
    // fields at the top level; strip our own wrapper keys when unwrapping the top-level form.
    const raw = (req.body ?? {}) as Record<string, unknown>;
    let payload: Record<string, unknown>;
    if (dto.payload && typeof dto.payload === 'object') {
      payload = dto.payload;
    } else {
      const { payload: _p, action: _a, ...rest } = raw;
      payload = rest;
    }

    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Missing IDKit proof payload');
    }

    // Optional linkage: if a JWT strategy already populated req.user, link the trial.
    const userId = (req as any).user?._id;

    return this.worldService.verifyAndCredit(payload, dto.action, userId);
  }

  /**
   * POST /world/consume-trial  { nullifier, action? }
   *
   * Atomically consumes ONE free trial (>=0 floor). This is the free-task gate: returns
   * whether a free trial was consumed vs. whether the caller must fall back to payment.
   * -> { consumed, paymentRequired, freeTrialsRemaining, nullifier }
   */
  @Post('consume-trial')
  async consumeTrial(@Body() body: { nullifier?: string; action?: string }) {
    if (!body?.nullifier) {
      throw new BadRequestException('nullifier is required to consume a free trial');
    }
    return this.worldService.consumeFreeTrial(body.nullifier, body.action);
  }

  /**
   * GET /world/trials?nullifier=0x...   (or authenticated user)
   * -> { nullifier, freeTrialsRemaining }
   */
  @Get('trials')
  async trials(@Req() req: Request, @Query('nullifier') nullifier?: string) {
    if (nullifier) {
      return this.worldService.getTrialsByNullifier(nullifier);
    }
    const userId = (req as any).user?._id;
    if (userId) {
      const view = await this.worldService.getTrialsByUser(userId);
      return view ?? { nullifier: null, freeTrialsRemaining: 0 };
    }
    throw new BadRequestException('Provide ?nullifier= or authenticate to read trials');
  }
}
