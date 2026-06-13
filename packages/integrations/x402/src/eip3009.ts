/**
 * EIP-3009 `transferWithAuthorization` typed-data assembly.
 *
 * Pure, offline construction of the EIP-712 payload a buyer signs to authorize a
 * gasless USDC transfer. This is the DOCUMENTED pattern the arc-circle SKILL
 * cites for Circle's nanopayment / x402 flow ("buyer signs EIP-3009 payment
 * authorizations, verified offchain, settled onchain"). Gateway-specific
 * endpoints are UNVERIFIED and not used here.
 */
import {
  hashTypedData,
  type TypedDataDomain,
  type Hex,
} from "viem";
import type {
  ChallengeAsset,
  TransferWithAuthorizationMessage,
} from "./types.js";

/** Canonical EIP-3009 typed-data `types` (struct field names + order matter). */
export const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export const EIP3009_PRIMARY_TYPE = "TransferWithAuthorization" as const;

/** Build the EIP-712 domain for a USDC token contract on a chain. */
export function buildDomain(
  asset: Pick<ChallengeAsset, "address" | "domainName" | "domainVersion">,
  chainId: number,
): TypedDataDomain {
  return {
    name: asset.domainName,
    version: asset.domainVersion,
    chainId,
    verifyingContract: asset.address,
  };
}

/** Assemble the full EIP-712 typed-data object for transferWithAuthorization. */
export function buildTypedData(
  asset: Pick<ChallengeAsset, "address" | "domainName" | "domainVersion">,
  chainId: number,
  message: TransferWithAuthorizationMessage,
) {
  return {
    domain: buildDomain(asset, chainId),
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

/** Deterministic EIP-712 digest for the authorization (used by verify/recover). */
export function authorizationDigest(
  asset: Pick<ChallengeAsset, "address" | "domainName" | "domainVersion">,
  chainId: number,
  message: TransferWithAuthorizationMessage,
): Hex {
  const td = buildTypedData(asset, chainId, message);
  return hashTypedData({
    domain: td.domain,
    types: td.types,
    primaryType: td.primaryType,
    message: td.message,
  });
}

/** ABI fragment for on-chain settlement via transferWithAuthorization. */
export const TRANSFER_WITH_AUTHORIZATION_ABI = [
  {
    type: "function",
    name: "transferWithAuthorization",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;
