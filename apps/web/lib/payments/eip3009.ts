/**
 * Browser-side EIP-3009 `transferWithAuthorization` payload construction for the
 * x402 USDC payment path on Arc.
 *
 * The buyer (the hiring user's connected wallet) signs an off-chain payment
 * authorization; apps/api verifies it and (in real mode) settles it on Arc via
 * transferWithAuthorization. Nothing here moves money — it only assembles the
 * typed data and turns a signature into the `/payments/settle` payload.
 *
 * The typed-data domain/types/message shape is kept byte-identical to
 * @actflow/integrations-x402's eip3009 module so signatures verify server-side.
 * We mirror (rather than import) it because that package is a server/node ESM
 * package; this keeps the browser bundle to viem only.
 *
 * MOCK SAFETY: `mockSignature` is a deterministic, clearly NON-valid signature
 * (it recovers to nothing) used only for the labeled demo path; the resulting
 * payload always carries `mock:true`.
 */
import { keccak256, toHex, type TypedDataDomain } from 'viem';

import type {
  ChallengeAsset,
  PaymentChallenge,
  PaymentPayload,
  TransferWithAuthorizationMessage,
} from '@/types/payments';

/** Canonical EIP-3009 typed-data `types` (field names + order are load-bearing). */
export const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

export const EIP3009_PRIMARY_TYPE = 'TransferWithAuthorization' as const;

/** Build the EIP-712 domain for the USDC token contract on a chain. */
export function buildDomain(
  asset: Pick<ChallengeAsset, 'address' | 'domainName' | 'domainVersion'>,
  chainId: number,
): TypedDataDomain {
  return {
    name: asset.domainName,
    version: asset.domainVersion,
    chainId,
    verifyingContract: asset.address,
  };
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
 * Assemble the full viem `signTypedData` argument for a challenge + payer. The
 * numeric fields are bigints, as viem requires for uint256/typed-data signing.
 */
export function buildTypedData(challenge: PaymentChallenge, from: `0x${string}`) {
  const message = challengeToMessage(challenge, from);
  return {
    domain: buildDomain(challenge.asset, challenge.chainId),
    types: EIP3009_TYPES,
    primaryType: EIP3009_PRIMARY_TYPE,
    message: {
      from: message.from,
      to: message.to,
      value: BigInt(message.value),
      validAfter: BigInt(message.validAfter),
      validBefore: BigInt(message.validBefore),
      nonce: message.nonce,
    },
  } as const;
}

/**
 * Wrap a real secp256k1 signature (from the connected wallet) into the
 * /payments/settle payload. No `mock` flag => the API treats it as a real
 * authorization to verify (and, when funded, settle) on Arc.
 */
export function buildSignedPayload(
  challenge: PaymentChallenge,
  from: `0x${string}`,
  signature: `0x${string}`,
): PaymentPayload {
  return {
    scheme: challenge.scheme,
    network: challenge.network,
    chainId: challenge.chainId,
    asset: challenge.asset.address,
    authorization: challengeToMessage(challenge, from),
    signature,
  };
}

/**
 * Deterministic MOCK signature — a 65-byte hex derived from the authorization
 * inputs. It is NOT a valid signature and recovers to nothing; it exists only so
 * the labeled demo path produces a well-shaped payload. Matches the format used
 * by @actflow/integrations-x402's mock signer.
 */
export function mockSignature(message: TransferWithAuthorizationMessage, challenge: PaymentChallenge): `0x${string}` {
  const seed = keccak256(
    toHex(
      `x402-mock-sig:${challenge.chainId}:${challenge.asset.address}:${message.from}:${message.to}:${message.value}:${message.validAfter}:${message.validBefore}:${message.nonce}`,
    ),
  );
  const s = keccak256(seed);
  return (seed + s.slice(2) + '1b') as `0x${string}`;
}

/**
 * Build a clearly-labeled MOCK payload (mock:true). Used when no funded/connected
 * wallet can produce a real signature (demo / no Arc funds). The `mock` flag
 * propagates through settle -> receipt -> UI so we NEVER imply a real on-chain
 * payment happened.
 */
export function buildMockPayload(
  challenge: PaymentChallenge,
  from: `0x${string}`,
): PaymentPayload {
  const authorization = challengeToMessage(challenge, from);
  return {
    scheme: challenge.scheme,
    network: challenge.network,
    chainId: challenge.chainId,
    asset: challenge.asset.address,
    authorization,
    signature: mockSignature(authorization, challenge),
    mock: true,
  };
}

/** A zero-ish placeholder payer used for mock payloads when no wallet is connected. */
export const MOCK_PAYER_PLACEHOLDER = '0x000000000000000000000000000000000000dEaD' as const;
