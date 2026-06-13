/**
 * Deterministic MOCK receipts for the Unlink private-payout wrapper.
 *
 * Used when creds are absent (or UNLINK_FORCE_MOCK is set, or the optional
 * @unlink-xyz/sdk can't load) so agents and tests work with NO Unlink account,
 * NO API key, and NO funds. Everything returned is tagged `mock: true` and the
 * ids/hashes are derived deterministically from the operation parameters — they
 * are NOT real on-chain or relayer transactions and move no value.
 */
import { createHash } from "node:crypto";

const MOCK_DOMAIN = "actflow:mock-unlink-payout:v1:";

/** Deterministic 32-byte hex digest (0x-prefixed) from a string seed. */
function digest(seed: string): `0x${string}` {
  return `0x${createHash("sha256").update(seed).digest("hex")}`;
}

export type UnlinkOp = "deposit" | "transfer" | "withdraw";

/** A labeled receipt from a private-payout primitive (mock or live). */
export interface UnlinkReceipt {
  /** Which private primitive produced this receipt. */
  op: UnlinkOp;
  /** Unlink transaction id (relayer/prepared row id). */
  txId: string;
  /** Terminal/relayer status. For mock receipts this is "mock-processed". */
  status: string;
  /**
   * Broadcast tx hash when known. Always null for mock receipts (and for live
   * handles until they reach a terminal status — read it after wait()).
   */
  txHash: string | null;
  /** Always true for mock receipts; absent on real receipts. */
  mock?: true;
}

/** Deterministic fake tx id for a mock op (clearly a mock, reproducible). */
export function mockTxId(op: UnlinkOp, parts: string[]): string {
  const seed = `${MOCK_DOMAIN}${op}:${parts.join(":")}`;
  // 32-byte digest, "mock-" prefixed so it can never be mistaken for a real id.
  return `mock-${digest(seed)}`;
}

/** Build a labeled mock receipt for an op. */
export function mockReceipt(op: UnlinkOp, parts: string[]): UnlinkReceipt {
  return {
    op,
    txId: mockTxId(op, parts),
    status: "mock-processed",
    txHash: null,
    mock: true,
  };
}
