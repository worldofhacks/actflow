/**
 * executeSwap — the full Uniswap Trading API execution path per the SKILL.
 *
 * Given a /quote response and a FUNDED viem walletClient (+ publicClient):
 *   1. If `quote.permitData` is present, sign it as EIP-712 typed data
 *      (primaryType "PermitSingle" — SKILL gotcha: viem needs this explicitly).
 *   2. If /check_approval returns an `approval` tx, send it and wait for receipt
 *      (only meaningful for ERC20 inputs; controlled by `checkApprovalFor`).
 *   3. Convert the quote via POST /swap into an unsigned tx, then send it with
 *      viem and return the tx hash.
 *
 * Wallet keys are NEVER read here — the caller injects a WalletClient with a
 * funded account (e.g. a Privy server wallet). Throws a clear error if absent.
 *
 * The classic-family routings (CLASSIC/WRAP/UNWRAP/BRIDGE) submit via /swap;
 * Dutch/priority families go to /order (gasless) — NOT handled here, we throw
 * a clear error so callers don't silently mis-route.
 */
import type {
  PublicClient,
  WalletClient,
  Hex,
  TypedDataDomain,
} from "viem";
import { TradingApiClient } from "./client.js";
import {
  CLASSIC_FAMILY_ROUTINGS,
  type QuoteResponse,
  type TransactionRequest,
} from "./types.js";

export interface ExecuteSwapParams {
  /** The full /quote response (from TradingApiClient.getQuote). */
  quote: QuoteResponse;
  /** Funded viem wallet client — REQUIRED to broadcast. Must have an account. */
  walletClient: WalletClient;
  /** Public client for receipt waiting. */
  publicClient: PublicClient;
  /** Reuse an existing client (auth/config) instead of constructing one. */
  client?: TradingApiClient;
  /**
   * If set, run /check_approval for this ERC20 input before swapping and send
   * the returned approval tx. Pass the input token + amount (base units).
   * Omit for native-ETH inputs (no approval needed).
   */
  checkApprovalFor?: {
    token: `0x${string}`;
    amount: string;
    /** Defaults to quote.quote.chainId. */
    chainId?: number;
    tokenOut?: `0x${string}`;
    tokenOutChainId?: number;
  };
  /** EIP-712 primaryType for the permit. SKILL: "PermitSingle". */
  permitPrimaryType?: string;
}

export interface ExecuteSwapResult {
  /** The broadcast swap transaction hash. */
  swapTxHash: Hex;
  /** Approval tx hash, if an approval was sent. */
  approvalTxHash?: Hex;
  /** Whether a Permit2 signature was produced and sent to /swap. */
  signedPermit: boolean;
  /** The /swap requestId (for tracing / status lookups). */
  requestId: string;
}

/** Convert an API transaction's optional string fields to viem tx params. */
function toViemTx(tx: TransactionRequest): {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
  gas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
} {
  return {
    to: tx.to,
    data: tx.data,
    value: BigInt(tx.value ?? 0),
    gas: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
    maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas
      ? BigInt(tx.maxPriorityFeePerGas)
      : undefined,
  };
}

/**
 * Execute a quoted swap end-to-end. Returns the swap tx hash.
 * DO NOT call in tests without a funded wallet — it broadcasts real txs.
 */
export async function executeSwap(
  params: ExecuteSwapParams,
): Promise<ExecuteSwapResult> {
  const { quote, walletClient, publicClient } = params;

  if (!walletClient) {
    throw new Error(
      "executeSwap requires a funded walletClient — none was provided.",
    );
  }
  const account = walletClient.account;
  if (!account) {
    throw new Error(
      "executeSwap requires walletClient.account — pass a funded account.",
    );
  }
  if (!publicClient) {
    throw new Error("executeSwap requires a publicClient for receipts.");
  }

  // Only classic-family routings are broadcast via /swap. Dutch/priority go to
  // /order (gasless) — refuse rather than mis-route (SKILL "Routing split").
  if (!CLASSIC_FAMILY_ROUTINGS.includes(quote.routing)) {
    throw new Error(
      `executeSwap only handles classic-family routings ` +
        `(${CLASSIC_FAMILY_ROUTINGS.join("/")}); got routing="${quote.routing}". ` +
        `Use POST /order for UniswapX (Dutch/priority) routings.`,
    );
  }

  const client = params.client ?? new TradingApiClient();
  const chain = walletClient.chain;

  // 1. Optional Permit2 approval (ERC20 inputs only).
  let approvalTxHash: Hex | undefined;
  if (params.checkApprovalFor) {
    const a = params.checkApprovalFor;
    const approvalRes = await client.checkApproval({
      walletAddress: account.address,
      token: a.token,
      amount: a.amount,
      chainId: a.chainId ?? quote.quote.chainId,
      tokenOut: a.tokenOut,
      tokenOutChainId: a.tokenOutChainId,
    });
    if (approvalRes.approval) {
      approvalTxHash = await walletClient.sendTransaction({
        account,
        chain,
        ...toViemTx(approvalRes.approval),
      });
      await publicClient.waitForTransactionReceipt({ hash: approvalTxHash });
    }
  }

  // 2. Sign Permit2 typed data if the quote carries permitData.
  let signature: Hex | undefined;
  let signedPermit = false;
  if (quote.permitData) {
    signature = await walletClient.signTypedData({
      account,
      domain: quote.permitData.domain as TypedDataDomain,
      types: quote.permitData.types as Record<
        string,
        Array<{ name: string; type: string }>
      >,
      // SKILL gotcha: viem needs an explicit primaryType; the spec's top-level
      // permitData.types entry is "PermitSingle".
      primaryType: params.permitPrimaryType ?? "PermitSingle",
      message: quote.permitData.values,
    });
    signedPermit = true;
  }

  // 3. Convert the quote to an unsigned tx via /swap, then broadcast it.
  const swapRes = await client.buildSwap(quote, {
    signature,
    // buildSwap defaults permitData from the quote; pass through explicitly so
    // the SKILL "pass both permitData and signature" rule always holds.
    permitData: quote.permitData ?? undefined,
  });

  const swapTxHash = await walletClient.sendTransaction({
    account,
    chain,
    ...toViemTx(swapRes.swap),
  });
  await publicClient.waitForTransactionReceipt({ hash: swapTxHash });

  return {
    swapTxHash,
    approvalTxHash,
    signedPermit,
    requestId: swapRes.requestId,
  };
}
