import { HttpException, Injectable, Logger } from '@nestjs/common';
import { WorldTrialRepository } from './repositories/world-trial.repository';
import { WorldConfig } from './world.config';
import {
  VerifyTarget,
  verifyWorldProof,
  WorldVerifyError,
  WorldVerifyResult,
} from './world-verify';

export type VerifyOutcome = {
  nullifier: string;
  freeTrialsRemaining: number;
  /** true when this verify credited a brand-new human; false when already seen. */
  credited: boolean;
  apiVersion: 'v4' | 'v2';
};

export type TrialView = {
  nullifier: string;
  freeTrialsRemaining: number;
};

export type ConsumeResult = {
  /** true => a free trial was consumed; false => none left, payment required. */
  consumed: boolean;
  /** false => caller must fall back to the paid (x402/USDC) flow. */
  paymentRequired: boolean;
  freeTrialsRemaining: number;
  nullifier: string;
};

@Injectable()
export class WorldService {
  private readonly logger = new Logger(WorldService.name);

  constructor(
    private readonly worldConfig: WorldConfig,
    private readonly trials: WorldTrialRepository,
    /**
     * Injectable fetch so tests never hit the live World API. Defaults to global fetch
     * (Node 22). The WorldModule provides the default; tests construct the service directly
     * with a mock.
     */
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private target(action: string): VerifyTarget {
    return {
      apiHost: this.worldConfig.apiHost,
      rpId: this.worldConfig.rpId,
      appId: this.worldConfig.appId,
      apiKey: this.worldConfig.apiKey,
      action,
    };
  }

  /**
   * Verify an IDKit payload server-side, then credit-if-new. One-per-human:
   *   - brand-new nullifier  -> credit freeTrialsPerHuman (default 3)
   *   - already-seen nullifier -> return its CURRENT remaining (no re-credit)
   */
  async verifyAndCredit(
    payload: Record<string, unknown>,
    action?: string,
    userId?: any,
  ): Promise<VerifyOutcome> {
    const act = action ?? this.worldConfig.actionId;

    let result: WorldVerifyResult;
    try {
      result = await verifyWorldProof(payload, this.target(act), this.fetchImpl);
    } catch (err) {
      if (err instanceof WorldVerifyError) {
        this.logger.warn(`World verify rejected: ${err.code} (${err.httpStatus})`);
        // Surface the World error code + status to the client (4xx).
        throw new HttpException(
          { message: err.message, code: err.code },
          err.httpStatus,
        );
      }
      throw err;
    }

    const { doc, credited } = await this.trials.creditIfNew({
      action: act,
      nullifierHash: result.nullifier,
      freeTrials: this.worldConfig.freeTrialsPerHuman,
      apiVersion: result.apiVersion,
      userId,
    });

    return {
      nullifier: result.nullifier,
      freeTrialsRemaining: doc.freeTrialsRemaining,
      credited,
      apiVersion: result.apiVersion,
    };
  }

  /** Read remaining trials for a nullifier (returns 0 if never verified). */
  async getTrialsByNullifier(nullifier: string, action?: string): Promise<TrialView> {
    const act = action ?? this.worldConfig.actionId;
    const doc = await this.trials.findByNullifier(act, nullifier);
    return { nullifier, freeTrialsRemaining: doc?.freeTrialsRemaining ?? 0 };
  }

  /** Read remaining trials for an authenticated user (their linked nullifier doc). */
  async getTrialsByUser(userId: any, action?: string): Promise<TrialView | null> {
    const act = action ?? this.worldConfig.actionId;
    const doc = await this.trials.findOneOrNull(act, userId);
    if (!doc) return null;
    return { nullifier: doc.nullifierHash, freeTrialsRemaining: doc.freeTrialsRemaining };
  }

  /**
   * Atomically consume one free trial for a human (>=0 floor). This is the gate for the
   * FREE task-execution path: call it where a task would otherwise require payment.
   *
   * Returns { consumed, paymentRequired }:
   *   - consumed=true  -> a free trial was used, proceed for free
   *   - consumed=false -> none left (or human never verified); paymentRequired=true so the
   *                       caller falls back to the paid x402/USDC flow.
   */
  async consumeFreeTrial(nullifier: string, action?: string): Promise<ConsumeResult> {
    const act = action ?? this.worldConfig.actionId;
    const updated = await this.trials.decrementIfAvailable(act, nullifier);
    if (updated) {
      return {
        consumed: true,
        paymentRequired: false,
        freeTrialsRemaining: updated.freeTrialsRemaining,
        nullifier,
      };
    }
    // No doc, or zero remaining: nothing consumed -> payment required.
    const existing = await this.trials.findByNullifier(act, nullifier);
    return {
      consumed: false,
      paymentRequired: true,
      freeTrialsRemaining: existing?.freeTrialsRemaining ?? 0,
      nullifier,
    };
  }
}
