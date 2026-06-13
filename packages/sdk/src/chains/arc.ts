// Arc (Circle) testnet chain config for the ActFlow SDK.
//
// Arc is Circle's EVM Layer-1 where USDC is the NATIVE gas token. This module is
// config-driven: the only hard-coded values are well-known, publicly documented
// network constants (chain id, public RPC, explorer) and the canonical Arc
// testnet USDC ERC-20 address — all cited inline from the arc-circle skill /
// Arc docs (https://docs.arc.io). No secrets, no private addresses.
//
// Sources (fetched 2026-06-12, see .claude/skills/arc-circle/SKILL.md):
//   - https://docs.arc.io/arc/references/connect-to-arc.md  (chain id, RPC, explorer, faucet, native gas = USDC)
//   - https://docs.arc.io/arc/references/contract-addresses (USDC ERC-20 interface @ 6 decimals)
//   - https://docs.arc.io/arc/references/gas-and-fees.md    (testnet min base fee = 20 Gwei)

import { defineChain, createPublicClient, createWalletClient, http } from "viem";
import type { Chain, PublicClient, WalletClient, Transport, Account } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/** Arc testnet chain id (verified live). Source: connect-to-arc.md */
export const ARC_TESTNET_CHAIN_ID = 5042002 as const;

/**
 * Public default RPC for Arc testnet. Source: connect-to-arc.md
 * Prefer the ARC_TESTNET_RPC_URL env var; this is only the fallback so build +
 * read-only flows work with no config.
 */
export const ARC_TESTNET_DEFAULT_RPC_URL =
  "https://rpc.testnet.arc.network" as const;

/** Public default WebSocket RPC for Arc testnet. Source: connect-to-arc.md */
export const ARC_TESTNET_DEFAULT_WS_URL =
  "wss://rpc.testnet.arc.network" as const;

/** Block explorer. Source: connect-to-arc.md */
export const ARC_TESTNET_EXPLORER_URL = "https://testnet.arcscan.app" as const;

/** USDC faucet (select Arc Testnet). Source: connect-to-arc.md */
export const ARC_TESTNET_FAUCET_URL = "https://faucet.circle.com" as const;

/**
 * Canonical Arc testnet USDC ERC-20 interface address (cited well-known
 * constant). The native gas token IS USDC at 18 decimals; this ERC-20 view
 * exposes the SAME balance at 6 decimals. Use `parseUnits(x, 6)` for ERC-20
 * `transfer`, `parseEther` for native value transfers. Source: contract-addresses.
 */
export const ARC_TESTNET_USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;

/** Decimals of the Arc USDC ERC-20 interface. Source: contract-addresses. */
export const ARC_TESTNET_USDC_DECIMALS = 6 as const;

/** Decimals of native USDC gas accounting. Source: gas-and-fees.md. */
export const ARC_TESTNET_NATIVE_DECIMALS = 18 as const;

/** Testnet minimum base fee in wei (20 Gwei). Source: gas-and-fees.md. */
export const ARC_TESTNET_MIN_BASE_FEE_WEI = 20_000_000_000n;

/** Typed descriptor for the Arc USDC ERC-20 token. */
export interface ArcUsdcToken {
  /** ERC-20 interface address. */
  address: `0x${string}`;
  /** ERC-20 decimals (6). */
  decimals: number;
  symbol: "USDC";
}

/** Well-known Arc testnet USDC token (cited constant, not a secret). */
export const ARC_TESTNET_USDC: ArcUsdcToken = {
  address: ARC_TESTNET_USDC_ADDRESS,
  decimals: ARC_TESTNET_USDC_DECIMALS,
  symbol: "USDC",
};

/**
 * Resolve the Arc testnet RPC URL: prefer the explicit override, then the
 * ARC_TESTNET_RPC_URL env var, then the documented public default. Pure /
 * side-effect free apart from reading process.env (guarded for non-Node hosts).
 */
export function getArcTestnetRpcUrl(override?: string): string {
  if (override && override.length > 0) return override;
  // Read process.env without depending on @types/node (SDK has no node types):
  // narrow globalThis to an optional env bag.
  const env = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;
  const fromEnv = env?.ARC_TESTNET_RPC_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return ARC_TESTNET_DEFAULT_RPC_URL;
}

/**
 * Build the Arc testnet viem `Chain` object.
 *
 * `nativeCurrency` is USDC at 18 decimals — Arc accounts for native gas in 18
 * decimals (the 6-decimal `ARC_TESTNET_USDC` ERC-20 view is the SAME balance).
 *
 * @param rpcUrl optional RPC override; defaults to ARC_TESTNET_RPC_URL env or
 *               the documented public endpoint.
 */
export function defineArcTestnet(rpcUrl?: string): Chain {
  const httpUrl = getArcTestnetRpcUrl(rpcUrl);
  return defineChain({
    id: ARC_TESTNET_CHAIN_ID,
    name: "Arc Testnet",
    nativeCurrency: {
      name: "USD Coin",
      symbol: "USDC",
      decimals: ARC_TESTNET_NATIVE_DECIMALS,
    },
    rpcUrls: {
      default: {
        http: [httpUrl],
        webSocket: [ARC_TESTNET_DEFAULT_WS_URL],
      },
    },
    blockExplorers: {
      default: { name: "ArcScan", url: ARC_TESTNET_EXPLORER_URL },
    },
    testnet: true,
  });
}

/**
 * The Arc testnet chain object using the default (env-or-public) RPC. Exported
 * as a convenience; call `defineArcTestnet(url)` to inject a custom RPC.
 */
export const arcTestnet: Chain = defineArcTestnet();

/** Options for {@link getArcPublicClient} / {@link getArcWalletClient}. */
export interface ArcClientOptions {
  /** RPC URL override (else ARC_TESTNET_RPC_URL env, else public default). */
  rpcUrl?: string;
  /** Pre-built chain object override (else {@link defineArcTestnet}). */
  chain?: Chain;
}

/**
 * Build a viem public (read) client for Arc testnet. No keys required —
 * read-only RPC. Safe to call in MOCK contexts (it just constructs a client).
 */
export function getArcPublicClient(
  options: ArcClientOptions = {}
): PublicClient {
  const chain = options.chain ?? defineArcTestnet(options.rpcUrl);
  const url = getArcTestnetRpcUrl(options.rpcUrl);
  return createPublicClient({ chain, transport: http(url) });
}

/** Options for {@link getArcWalletClient}: exactly one signing source. */
export interface ArcWalletClientOptions extends ArcClientOptions {
  /**
   * Private key (0x-prefixed) for an EOA. NEVER hard-code — pass from env/secret
   * manager at call time. Mutually exclusive with `account`.
   */
  privateKey?: `0x${string}`;
  /** Pre-built viem Account (e.g. from Privy / custom signer). */
  account?: Account;
}

/**
 * Build a viem wallet (write) client for Arc testnet.
 *
 * Supply EITHER `account` (a pre-built signer) OR `privateKey` (read from a
 * secret at call time — never committed). Throws if neither is given, so callers
 * must explicitly provide credentials; this keeps the SDK free of any embedded
 * key and lets MOCK paths avoid building a wallet client entirely.
 */
export function getArcWalletClient(
  options: ArcWalletClientOptions
): WalletClient<Transport, Chain, Account> {
  const chain = options.chain ?? defineArcTestnet(options.rpcUrl);
  const url = getArcTestnetRpcUrl(options.rpcUrl);
  const account =
    options.account ??
    (options.privateKey ? privateKeyToAccount(options.privateKey) : undefined);
  if (!account) {
    throw new Error(
      "getArcWalletClient requires an `account` or a `privateKey` (provide via env/secret at call time; never hard-code)."
    );
  }
  return createWalletClient({ account, chain, transport: http(url) });
}
