/**
 * signPaymentAuthorization — turn a 402 challenge into a signed EIP-3009
 * transferWithAuthorization payload.
 *
 * The agents' IWalletProvider (getAddress/getBalance/pay) has NO signing method,
 * so this accepts a slightly wider "signer":
 *   - LIVE: any object exposing getAddress() + a typed-data signer — either a
 *     viem-style `signTypedData({domain,types,primaryType,message})` or a raw
 *     `signTypedData(typedData)`; the buyer's USDC EOA signs the authorization.
 *   - MOCK: an IWalletProvider with no signer (or X402_FORCE_MOCK) -> a
 *     deterministic, clearly-labeled mock signature (mock:true). No funds/keys.
 *
 * Nothing here moves money: it only produces the off-chain authorization the
 * resource server later verifies and (in real mode) settles via
 * transferWithAuthorization.
 */
import { keccak256, toHex } from "viem";
import type { IWalletProvider } from "@actflow/sdk";
import { buildTypedData } from "./eip3009.js";
import type {
  PaymentChallenge,
  PaymentPayload,
  TransferWithAuthorizationMessage,
} from "./types.js";
import { ENV } from "./config.js";

/** A typed-data signer (viem WalletClient/Account-style). */
export interface TypedDataSigner {
  getAddress?(): Promise<string>;
  address?: string;
  signTypedData(args: unknown): Promise<`0x${string}`>;
}

/** What signPaymentAuthorization accepts: the wallet provider or a raw signer. */
export type PaymentSigner = IWalletProvider | TypedDataSigner;

export interface SignOptions {
  /** Override the payer address (else read from the signer). */
  from?: `0x${string}`;
  /** Env override (for the force-mock check). */
  env?: NodeJS.ProcessEnv;
  /** Force a mock signature regardless of signer capability. */
  forceMock?: boolean;
}

function hasTypedDataSigner(s: PaymentSigner): s is TypedDataSigner {
  return typeof (s as TypedDataSigner).signTypedData === "function";
}

async function resolveFrom(
  signer: PaymentSigner,
  override?: `0x${string}`,
): Promise<`0x${string}`> {
  if (override) return override;
  const anySigner = signer as TypedDataSigner & IWalletProvider;
  if (typeof anySigner.getAddress === "function") {
    return (await anySigner.getAddress()) as `0x${string}`;
  }
  if (anySigner.address) return anySigner.address as `0x${string}`;
  throw new Error("signer exposes neither getAddress() nor address.");
}

function truthyFlag(v: string | undefined): boolean {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes" || t === "on";
}

/**
 * Deterministic MOCK signature — a 65-byte hex derived from the authorization
 * digest inputs. It is NOT a valid secp256k1 signature and recovers to nothing;
 * it exists so the mock flow has a well-shaped payload. Always tagged mock:true.
 */
function mockSignature(
  message: TransferWithAuthorizationMessage,
  chainId: number,
  asset: `0x${string}`,
): `0x${string}` {
  const seed = keccak256(
    toHex(
      `x402-mock-sig:${chainId}:${asset}:${message.from}:${message.to}:${message.value}:${message.validAfter}:${message.validBefore}:${message.nonce}`,
    ),
  );
  // 32-byte r (=seed) + 32-byte s (=keccak(seed)) + 1-byte v (0x1b) = 65 bytes.
  const s = keccak256(seed);
  return (seed + s.slice(2) + "1b") as `0x${string}`;
}

/** Build the EIP-3009 message embedded in a challenge for a given payer. */
export function challengeToMessage(
  challenge: PaymentChallenge,
  from: `0x${string}`,
): TransferWithAuthorizationMessage {
  return {
    from,
    to: challenge.recipient,
    value: challenge.amount,
    validAfter: String(challenge.validAfter),
    validBefore: String(challenge.validBefore),
    nonce: challenge.nonce,
  };
}

/**
 * Sign a 402 challenge, producing an EIP-3009 transferWithAuthorization payload.
 * Mock when the signer can't sign typed data (or X402_FORCE_MOCK / forceMock).
 */
export async function signPaymentAuthorization(
  signer: PaymentSigner,
  challenge: PaymentChallenge,
  options: SignOptions = {},
): Promise<PaymentPayload> {
  if (challenge.scheme !== "eip3009-transferWithAuthorization") {
    throw new Error(`unsupported scheme: ${challenge.scheme}`);
  }
  const from = await resolveFrom(signer, options.from);
  const message = challengeToMessage(challenge, from);

  const forceMock =
    options.forceMock ?? truthyFlag((options.env ?? process.env)[ENV.forceMock]);
  const canSign = hasTypedDataSigner(signer);

  if (forceMock || !canSign) {
    return {
      scheme: challenge.scheme,
      network: challenge.network,
      chainId: challenge.chainId,
      asset: challenge.asset.address,
      authorization: message,
      signature: mockSignature(message, challenge.chainId, challenge.asset.address),
      mock: true,
    };
  }

  // LIVE: assemble EIP-712 typed data and ask the signer to sign it.
  const typedData = buildTypedData(
    challenge.asset,
    challenge.chainId,
    message,
  );
  const signature = await (signer as TypedDataSigner).signTypedData({
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
  });

  return {
    scheme: challenge.scheme,
    network: challenge.network,
    chainId: challenge.chainId,
    asset: challenge.asset.address,
    authorization: message,
    signature,
  };
}
