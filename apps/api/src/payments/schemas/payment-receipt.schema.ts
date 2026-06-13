import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentReceiptDocument = PaymentReceipt & Document;

/**
 * One document per successful task unlock — whether via x402 USDC payment or a World ID
 * free trial. This is the payment-history record served by GET /payments/receipts.
 *
 * The `mock` flag is load-bearing: it is carried straight through from the x402
 * verifyPayment result so a labeled MOCK settlement (no real funds) is NEVER presented as a
 * real on-chain payment. `explorerUrl` is only populated for real txs (a tx hash exists).
 */
@Schema({ timestamps: true, collection: 'paymentreceipts' })
export class PaymentReceipt {
  /** How the task was unlocked. */
  @Prop({ required: true, enum: ['x402', 'world-trial'], index: true })
  method: 'x402' | 'world-trial';

  /** Payer address (x402: authorization.from) or user/nullifier ref (world-trial). */
  @Prop({ required: true, index: true })
  payer: string;

  /** The agent/escrow being paid (recipient of the challenge). */
  @Prop({ required: true, index: true })
  agent: string;

  /** Amount in USDC base units (string). '0' for free-trial unlocks. */
  @Prop({ required: true, default: '0' })
  amount: string;

  /** Human-readable amount (decimal string) for display. */
  @Prop({ required: false })
  amountDecimal?: string;

  /** Asset (USDC ERC-20) address paid in. */
  @Prop({ required: false })
  asset?: string;

  /** Arc chain id the payment targets. */
  @Prop({ required: true })
  chainId: number;

  /** On-chain settlement tx hash, only for REAL settlements. */
  @Prop({ required: false })
  txHash?: string;

  /**
   * True when produced WITHOUT real funds/settlement (labeled MOCK path). Never presented as
   * a real payment. Always true for world-trial unlocks (no chain settlement).
   */
  @Prop({ required: true, default: true })
  mock: boolean;

  /** Arc explorer link for the tx (real txs only; undefined for mock/world-trial). */
  @Prop({ required: false })
  explorerUrl?: string;

  /** The resource (task id / topic) this unlock applies to. */
  @Prop({ required: false, index: true })
  resource?: string;

  /** The unlocked task's mongo id (when tied into the task service). */
  @Prop({ required: false })
  taskId?: string;

  /** Optional linked ActFlow user id. */
  @Prop({ required: false, index: true })
  userId?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PaymentReceiptSchema = SchemaFactory.createForClass(PaymentReceipt);

// History queries are by payer or agent, newest-first.
PaymentReceiptSchema.index({ payer: 1, createdAt: -1 });
PaymentReceiptSchema.index({ agent: 1, createdAt: -1 });
