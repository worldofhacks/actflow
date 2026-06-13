import { IsNumberString, IsOptional, IsString } from 'class-validator';

/**
 * POST /payments/hire body.
 *
 * Given an agent to hire and a price, the server returns an HTTP 402 with a 402 challenge
 * body (the client must then pay via /payments/settle). If a valid `worldNullifier` with a
 * remaining free trial is supplied, the task is unlocked WITHOUT payment instead (one
 * coherent "unlock task" decision — see PaymentsService.hire).
 */
export class HireDto {
  /** Agent (payee) address. Falls back to PAYMENTS_ESCROW_ADDRESS when omitted. */
  @IsOptional()
  @IsString()
  agentAddress?: string;

  /** The task/topic the payment unlocks (the x402 `resource`). */
  @IsString()
  resource: string;

  /** Topic of the task (display/categorisation). */
  @IsOptional()
  @IsString()
  topic?: string;

  /** Price in USDC (decimal string, e.g. "0.05"). Falls back to PAYMENTS_DEFAULT_PRICE. */
  @IsOptional()
  @IsNumberString()
  price?: string;

  /** Optional human description carried into the challenge. */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Optional World ID nullifier (proof-of-human). When present and a free trial remains, the
   * task unlocks for FREE and a method:'world-trial' receipt is written instead of a 402.
   */
  @IsOptional()
  @IsString()
  worldNullifier?: string;

  /** Optional World action id (defaults to the WorldService default server-side). */
  @IsOptional()
  @IsString()
  worldAction?: string;
}
