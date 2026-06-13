/**
 * verifyPayment — validate an EIP-3009 payment payload against the 402 challenge
 * that requested it, and (in real mode, with a funded settler + RPC) settle it
 * on Arc via transferWithAuthorization.
 *
 * Validation (always, offline):
 *   - scheme / network / chainId / asset match the challenge
 *   - recipient (`to`) matches the challenge recipient
 *   - amount (`value`) matches the challenge amount exactly
 *   - nonce matches the challenge nonce
 *   - not expired (now <= validBefore) and active (now >= validAfter)
 *   - signature shape (65-byte hex)
 *
 * Modes:
 *   - MOCK   (payload.mock, no settler/RPC, or X402_FORCE_MOCK): returns a
 *     labeled mock receipt {paid:true, mock:true} once validation passes — NO
 *     on-chain settlement, NO funds. Never presented as a real payment.
 *   - REAL   (a funded settler WalletClient + public client present): recovers
 *     the payer from the EIP-712 signature, then submits transferWithAuthorization
 *     and returns {paid:true, txHash}.
 */
import {
  recoverTypedDataAddress,
  type Hex,
} from "viem";
import {
  buildTypedData,
  TRANSFER_WITH_AUTHORIZATION_ABI,
} from "./eip3009.js";
import type {
  PaymentChallenge,
  PaymentPayload,
  PaymentReceipt,
} from "./types.js";
import { ENV } from "./config.js";

/** Minimal viem-ish settler surface for the real path (kept structural). */
export interface PaymentSettler {
  /** Submit transferWithAuthorization; returns the tx hash. */
  writeContract(args: {
    address: `0x${string}`;
    abi: typeof TRANSFER_WITH_AUTHORIZATION_ABI;
    functionName: "transferWithAuthorization";
    args: readonly unknown[];
    account?: unknown;
    chain?: unknown;
  }): Promise<`0x${string}`>;
}

export interface VerifyOptions {
  /** Override "now" (unix seconds). */
  now?: number;
  /** Provide a funded settler to actually settle on-chain (real mode). */
  settler?: PaymentSettler;
  /** Wait-for-receipt callback (optional; real mode). */
  waitForReceipt?: (hash: `0x${string}`) => Promise<unknown>;
  /** Env override (for force-mock). */
  env?: NodeJS.ProcessEnv;
  /** Force mock receipt regardless of settler presence. */
  forceMock?: boolean;
}

function truthyFlag(v: string | undefined): boolean {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes" || t === "on";
}

function eqAddr(a: string | undefined, b: string | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

function reject(reason: string): PaymentReceipt {
  return { paid: false, reason };
}

/** Split a 65-byte signature into r, s, v for transferWithAuthorization. */
function splitSignature(sig: Hex): { r: Hex; s: Hex; v: number } {
  const hex = sig.slice(2);
  if (hex.length !== 130) {
    throw new Error("signature must be 65 bytes (132 hex chars incl. 0x).");
  }
  const r = ("0x" + hex.slice(0, 64)) as Hex;
  const s = ("0x" + hex.slice(64, 128)) as Hex;
  let v = parseInt(hex.slice(128, 130), 16);
  if (v < 27) v += 27; // normalize 0/1 -> 27/28
  return { r, s, v };
}

/**
 * Validate (and optionally settle) a payment payload against its challenge.
 * Returns a receipt. Validation failures return {paid:false, reason}.
 */
export async function verifyPayment(
  challenge: PaymentChallenge,
  payload: PaymentPayload,
  options: VerifyOptions = {},
): Promise<PaymentReceipt> {
  // --- structural / field checks (offline) ---
  if (payload.scheme !== challenge.scheme) return reject("scheme mismatch");
  if (payload.network !== challenge.network) return reject("network mismatch");
  if (payload.chainId !== challenge.chainId) return reject("chainId mismatch");
  if (!eqAddr(payload.asset, challenge.asset.address)) return reject("asset mismatch");

  const auth = payload.authorization;
  if (!eqAddr(auth.to, challenge.recipient)) return reject("recipient mismatch");
  if (auth.value !== challenge.amount) return reject("amount mismatch");
  if (auth.nonce.toLowerCase() !== challenge.nonce.toLowerCase()) {
    return reject("nonce mismatch");
  }
  if (Number(auth.validBefore) !== challenge.validBefore) {
    return reject("validBefore mismatch");
  }
  if (Number(auth.validAfter) !== challenge.validAfter) {
    return reject("validAfter mismatch");
  }

  // --- time window ---
  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (now > Number(auth.validBefore)) return reject("authorization expired");
  if (now < Number(auth.validAfter)) return reject("authorization not yet valid");

  // --- signature shape ---
  if (!/^0x[0-9a-fA-F]{130}$/.test(payload.signature)) {
    return reject("malformed signature (expected 65-byte hex)");
  }

  const forceMock =
    options.forceMock ?? truthyFlag((options.env ?? process.env)[ENV.forceMock]);
  const isMockPayload = payload.mock === true;

  // --- MOCK receipt: validation passed, no settlement, no funds ---
  if (isMockPayload || forceMock || !options.settler) {
    return {
      paid: true,
      mock: true,
      payer: auth.from,
      reason: isMockPayload
        ? "mock payload accepted (no on-chain settlement)"
        : "validated offline; no settler supplied (mock receipt)",
    };
  }

  // --- REAL: recover payer from EIP-712 signature, then settle on Arc ---
  const typedData = buildTypedData(challenge.asset, challenge.chainId, auth);
  let recovered: `0x${string}`;
  try {
    recovered = await recoverTypedDataAddress({
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
      signature: payload.signature,
    });
  } catch (err) {
    return reject(
      `signature recovery failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!eqAddr(recovered, auth.from)) {
    return reject("signature does not match authorization.from");
  }

  const { r, s, v } = splitSignature(payload.signature);
  let txHash: `0x${string}`;
  try {
    txHash = await options.settler.writeContract({
      address: challenge.asset.address,
      abi: TRANSFER_WITH_AUTHORIZATION_ABI,
      functionName: "transferWithAuthorization",
      args: [
        auth.from,
        auth.to,
        BigInt(auth.value),
        BigInt(auth.validAfter),
        BigInt(auth.validBefore),
        auth.nonce,
        v,
        r,
        s,
      ],
    });
  } catch (err) {
    return reject(
      `settlement failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (options.waitForReceipt) {
    await options.waitForReceipt(txHash).catch(() => undefined);
  }
  return { paid: true, txHash, payer: recovered };
}
