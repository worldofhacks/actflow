import { IsObject, IsOptional, IsString } from 'class-validator';
import type {
  X402PaymentChallenge,
  X402PaymentPayload,
} from '../x402.loader';

/**
 * POST /payments/settle body.
 *
 * The client returns BOTH the original 402 challenge (so the server can verify the payment
 * matches recipient/amount/asset/nonce/deadline) and the signed payment payload (the
 * EIP-3009 transferWithAuthorization authorization + signature). verifyPayment is then called
 * and, on { paid: true }, the task is unlocked and a receipt is written.
 *
 * The payload's fields are validated structurally inside the x402 package; here we accept them
 * as opaque objects (mirroring the World DTO's permissive forward-as-is approach).
 */
export class SettleDto {
  /** The 402 challenge previously returned by POST /payments/hire. */
  @IsObject()
  challenge: X402PaymentChallenge;

  /** The signed EIP-3009 payment payload produced by the client's wallet. */
  @IsObject()
  payload: X402PaymentPayload;

  /** The task/topic this payment unlocks (defaults to challenge.resource). */
  @IsOptional()
  @IsString()
  resource?: string;
}
