import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WorldService } from '../world/world.service';
import { PaymentsConfig } from './payments.config';
import { PaymentReceiptRepository } from './repositories/payment-receipt.repository';
import { PaymentReceiptDocument } from './schemas/payment-receipt.schema';
import {
  loadX402,
  X402PaymentChallenge,
  X402PaymentPayload,
  X402PaymentReceipt,
} from './x402.loader';

/** A 402 PaymentRequired response: the challenge body the client must pay. */
export interface HirePaymentRequired {
  status: 402;
  /** The x402 challenge the client signs + returns to /payments/settle. */
  challenge: X402PaymentChallenge;
  /** How to satisfy the challenge (settle endpoint + the free-trial alternative). */
  settle: { endpoint: string; method: 'POST' };
}

/** A free unlock via World ID — no payment was required. */
export interface HireFreeUnlock {
  status: 200;
  method: 'world-trial';
  /** The BINDING decision: true => the task record was actually marked unlocked/funded. */
  unlocked: boolean;
  /** Mongo id of the task that was unlocked (when one exists for the resource). */
  taskId?: string;
  freeTrialsRemaining: number;
  receipt: ReceiptView;
}

export type HireResult = HirePaymentRequired | HireFreeUnlock;

/** The result of settling an x402 payment. */
export interface SettleResult {
  paid: boolean;
  /** The BINDING decision: true => the task record was actually marked unlocked/funded. */
  unlocked: boolean;
  /** Mongo id of the task that was unlocked (when one exists for the resource). */
  taskId?: string;
  /** Carried straight from verifyPayment — true => labeled MOCK, never a real payment. */
  mock: boolean;
  txHash?: string;
  explorerUrl?: string;
  reason?: string;
  receipt?: ReceiptView;
}

/** API-facing receipt shape (mock + explorerUrl always present-or-absent coherently). */
export interface ReceiptView {
  id: string;
  method: 'x402' | 'world-trial';
  payer: string;
  agent: string;
  amount: string;
  amountDecimal?: string;
  asset?: string;
  chainId: number;
  txHash?: string;
  mock: boolean;
  explorerUrl?: string;
  resource?: string;
  taskId?: string;
  userId?: string;
  createdAt: Date;
}

export interface HireParams {
  agentAddress?: string;
  resource: string;
  topic?: string;
  price?: string;
  description?: string;
  worldNullifier?: string;
  worldAction?: string;
  userId?: string;
}

export interface SettleParams {
  challenge: X402PaymentChallenge;
  payload: X402PaymentPayload;
  resource?: string;
  userId?: string;
}

/** Context handed to the unlock hook for a verified payment / consumed free trial. */
export interface UnlockTaskContext {
  resource: string;
  agent: string;
  payer: string;
  method: 'x402' | 'world-trial';
  mock: boolean;
}

/**
 * Outcome of binding a payment to a task. `taskId` is the mongo id of the task that was
 * actually unlocked (undefined if no task exists yet for the resource). `unlocked` reflects
 * the BINDING decision (true => the task record was marked unlocked/funded). `attachReceipt`,
 * when present, ties the just-written receipt id back onto the task for audit.
 */
export interface UnlockTaskResult {
  taskId?: string;
  unlocked: boolean;
  attachReceipt?: (receiptId: string) => Promise<void> | void;
}

/**
 * Optional hook so a task is actually created/unlocked when a payment (or a trial) succeeds.
 * May return just a mongo task id (legacy) or a richer UnlockTaskResult (binding decision +
 * receipt tie-back).
 */
export type UnlockTaskHook = (
  ctx: UnlockTaskContext,
) =>
  | Promise<string | UnlockTaskResult | undefined>
  | string
  | UnlockTaskResult
  | undefined;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: PaymentsConfig,
    private readonly receipts: PaymentReceiptRepository,
    /**
     * World ID free-trial gate (exported by WorldModule). Used to satisfy the "unlock task"
     * decision WITHOUT payment when a valid nullifier with remaining trials is supplied.
     */
    private readonly worldService: WorldService,
  ) {}

  private isAddress(v: string | undefined): v is `0x${string}` {
    return !!v && /^0x[0-9a-fA-F]{40}$/.test(v);
  }

  private resolveRecipient(agentAddress?: string): `0x${string}` {
    const candidate = agentAddress ?? this.config.escrowAddress;
    if (!this.isAddress(candidate)) {
      throw new BadRequestException(
        'A valid agentAddress (0x...) is required, or configure PAYMENTS_ESCROW_ADDRESS.',
      );
    }
    return candidate;
  }

  private resolvePrice(price?: string): string {
    const value = price ?? this.config.defaultPrice;
    if (!value) {
      throw new BadRequestException(
        'A price is required, or configure PAYMENTS_DEFAULT_PRICE.',
      );
    }
    return value;
  }

  /**
   * The single coherent "unlock task" decision.
   *
   *   - worldNullifier supplied + a free trial remains -> consume it, unlock for FREE, write a
   *     method:'world-trial' receipt (mock:true; no chain settlement) -> 200.
   *   - otherwise (no nullifier, or none remaining) -> build a 402 challenge in Arc USDC and
   *     return HTTP 402; the client pays via POST /payments/settle.
   */
  async hire(params: HireParams, unlockTask?: UnlockTaskHook): Promise<HireResult> {
    const recipient = this.resolveRecipient(params.agentAddress);

    // --- World ID free-trial alternative (no payment) ---
    if (params.worldNullifier) {
      const consume = await this.worldService.consumeFreeTrial(
        params.worldNullifier,
        params.worldAction,
      );
      if (consume.consumed) {
        const unlock = await this.runUnlock(unlockTask, {
          resource: params.resource,
          agent: recipient,
          payer: params.worldNullifier,
          method: 'world-trial',
          mock: true,
        });
        const doc = await this.receipts.create({
          method: 'world-trial',
          payer: params.worldNullifier,
          agent: recipient,
          amount: '0',
          amountDecimal: '0',
          chainId: this.config.chainId,
          mock: true,
          resource: params.resource,
          taskId: unlock.taskId,
          userId: params.userId,
        });
        // Tie the just-written receipt back onto the unlocked task (audit).
        await this.bindReceipt(unlock, doc._id.toString());
        return {
          status: 200,
          method: 'world-trial',
          unlocked: unlock.unlocked,
          taskId: unlock.taskId,
          freeTrialsRemaining: consume.freeTrialsRemaining,
          receipt: this.toView(doc),
        };
      }
      // No trial left -> fall through to the paid path (payment required).
    }

    // --- x402 payment required ---
    const x402 = await loadX402();
    const price = this.resolvePrice(params.price);
    const challenge = x402.build402Challenge({
      amount: price,
      recipient,
      resource: params.resource,
      chainId: this.config.chainId,
      ttlSeconds: this.config.challengeTtlSeconds,
      description: params.description ?? params.topic,
    });

    return {
      status: 402,
      challenge,
      settle: { endpoint: '/payments/settle', method: 'POST' },
    };
  }

  /**
   * Settle an x402 payment: verify the signed payload against its challenge, and on
   * { paid:true } unlock the task + write a receipt. The mock flag from verifyPayment is
   * carried straight through to the receipt + response so a labeled MOCK settlement is never
   * presented as a real on-chain payment.
   */
  async settle(params: SettleParams, unlockTask?: UnlockTaskHook): Promise<SettleResult> {
    const { challenge, payload } = params;
    if (!challenge || !payload) {
      throw new BadRequestException('Both `challenge` and `payload` are required.');
    }

    const x402 = await loadX402();

    // No funded settler in this environment (no Arc funds / Privy creds): verifyPayment
    // returns a labeled mock receipt once validation passes. forceMock makes that explicit.
    const result: X402PaymentReceipt = await x402.verifyPayment(challenge, payload, {
      forceMock: this.config.forceMock,
    });

    if (!result.paid) {
      return {
        paid: false,
        unlocked: false,
        mock: result.mock ?? true,
        reason: result.reason,
      };
    }

    const resource = params.resource ?? challenge.resource;
    const mock = result.mock === true;
    const payer = result.payer ?? payload.authorization.from;

    const unlock = await this.runUnlock(unlockTask, {
      resource,
      agent: challenge.recipient,
      payer,
      method: 'x402',
      mock,
    });

    // explorerUrl only for REAL settlements (a tx hash exists). Mock receipts carry none.
    const explorerUrl = mock ? undefined : this.config.explorerTxUrl(result.txHash);

    const doc = await this.receipts.create({
      method: 'x402',
      payer,
      agent: challenge.recipient,
      amount: challenge.amount,
      amountDecimal: challenge.amountDecimal,
      asset: challenge.asset.address,
      chainId: challenge.chainId,
      txHash: result.txHash,
      mock,
      explorerUrl,
      resource,
      taskId: unlock.taskId,
      userId: params.userId,
    });

    // Tie the just-written receipt back onto the unlocked task (audit).
    await this.bindReceipt(unlock, doc._id.toString());

    return {
      paid: true,
      // The BINDING decision: the task was actually marked unlocked/funded (true) or no task
      // existed yet for the resource (false — receipt still written).
      unlocked: unlock.unlocked,
      taskId: unlock.taskId,
      mock,
      txHash: result.txHash,
      explorerUrl,
      receipt: this.toView(doc),
    };
  }

  /** Tie the just-written receipt id back onto the task record (non-fatal). */
  private async bindReceipt(unlock: UnlockTaskResult, receiptId: string): Promise<void> {
    if (!unlock.attachReceipt) return;
    try {
      await unlock.attachReceipt(receiptId);
    } catch (err) {
      this.logger.warn(
        `attachReceipt failed for receipt ${receiptId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * Run the optional task-unlock hook, normalizing its result. Swallows failures (the receipt
   * is still written) but returns the binding decision so callers can surface `unlocked`.
   */
  private async runUnlock(
    unlockTask: UnlockTaskHook | undefined,
    ctx: UnlockTaskContext,
  ): Promise<UnlockTaskResult> {
    if (!unlockTask) return { unlocked: false };
    try {
      const out = await unlockTask(ctx);
      if (out === undefined || out === null) return { unlocked: false };
      if (typeof out === 'string') return { taskId: out, unlocked: true };
      return out;
    } catch (err) {
      this.logger.warn(
        `unlock task hook failed for resource ${ctx.resource}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return { unlocked: false };
    }
  }

  /** Payment history by payer/agent/user. */
  async listReceipts(
    filter: { payer?: string; agent?: string; userId?: string },
    options: { skip?: number; limit?: number } = {},
  ): Promise<ReceiptView[]> {
    if (!filter.payer && !filter.agent && !filter.userId) {
      throw new BadRequestException(
        'Provide at least one of ?payer= , ?agent= , or authenticate.',
      );
    }
    const docs = await this.receipts.findHistory(filter, options);
    return docs.map((d) => this.toView(d));
  }

  /** A single receipt by id. */
  async getReceipt(id: string): Promise<ReceiptView> {
    const doc = await this.receipts.findByIdOrNull(id);
    if (!doc) {
      throw new NotFoundException(`Receipt not found: ${id}`);
    }
    return this.toView(doc);
  }

  private toView(doc: PaymentReceiptDocument): ReceiptView {
    return {
      id: doc._id.toString(),
      method: doc.method,
      payer: doc.payer,
      agent: doc.agent,
      amount: doc.amount,
      amountDecimal: doc.amountDecimal,
      asset: doc.asset,
      chainId: doc.chainId,
      txHash: doc.txHash,
      mock: doc.mock,
      explorerUrl: doc.explorerUrl,
      resource: doc.resource,
      taskId: doc.taskId,
      userId: doc.userId,
      createdAt: doc.createdAt,
    };
  }
}
