/**
 * PrivyWalletProvider — implements the ActFlow agents' IWalletProvider
 * (getAddress / getBalance / pay) backed by Privy server wallets on Arc.
 *
 * Two modes, decided by resolvePrivyConfig():
 *  - LIVE  (PRIVY_APP_ID + PRIVY_APP_SECRET present): creates/fetches a Privy
 *    server wallet, reads USDC balance via the configured Arc RPC, and sends a
 *    USDC ERC-20 transfer by submitting calldata through Privy's sendTransaction.
 *  - MOCK  (creds absent / PRIVY_FORCE_MOCK): a deterministic in-memory wallet.
 *    Every result is tagged `mock: true`; no Privy account or funds required.
 *
 * The IWalletProvider shape is matched structurally AND verified against the real
 * interface from @actflow/agents in the conformance test. Wallet secrets are
 * never logged. The Privy SDK is imported dynamically so this module loads even
 * when @privy-io/node is not installed (mock-only environments).
 */
import {
  createPublicClient,
  http,
  defineChain,
  encodeFunctionData,
  parseAbi,
  formatUnits,
  parseUnits,
  type PublicClient,
  type Chain,
} from "viem";
import type {
  IWalletProvider,
  WalletBalance,
  PaymentRequest,
  PaymentResult,
} from "@actflow/agents";
import {
  resolvePrivyConfig,
  type PrivyProviderConfig,
  type ChainConfig,
} from "./config.js";
import { createMockWallet, mockTxHash, type MockWalletHandle } from "./mock-wallet.js";

const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 value) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

/** Build a viem Chain from resolved config (Arc testnet by default). */
function toViemChain(c: ChainConfig): Chain {
  return defineChain({
    id: c.chainId,
    name: `chain-${c.chainId}`,
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrls: { default: { http: [c.rpcUrl] } },
    blockExplorers: { default: { name: "Explorer", url: c.explorer } },
  });
}

export interface PrivyWalletProviderOptions {
  /** Override resolved config (e.g. for tests). */
  config?: PrivyProviderConfig;
  /** Logical label for the agent wallet (used for the mock + Privy display). */
  label?: string;
  /** Inject an env object (tests). Ignored when `config` is given. */
  env?: NodeJS.ProcessEnv;
}

/**
 * Minimal structural view of the Privy SDK pieces we use. Kept local so the
 * package type-checks without @privy-io/node installed; the dynamic import is
 * cast to this shape. Field names are snake_case to match the SDK.
 */
interface PrivyLike {
  wallets(): {
    create(input: {
      chain_type: "ethereum";
      display_name?: string;
    }): Promise<{ id: string; address: string }>;
    get(walletId: string): Promise<{ id: string; address: string }>;
    ethereum(): {
      sendTransaction(
        walletId: string,
        input: {
          caip2: string;
          params: {
            transaction: {
              to: string;
              data?: string;
              value?: string;
              chain_id: number;
            };
          };
          authorization_context?: { authorization_private_keys: string[] };
        },
      ): Promise<{ hash: string; caip2: string }>;
    };
  };
}

export class PrivyWalletProvider implements IWalletProvider {
  readonly mode: "live" | "mock";
  private readonly config: PrivyProviderConfig;
  private readonly chain: Chain;
  private readonly label: string;

  private publicClient?: PublicClient;
  private mockWallet?: MockWalletHandle;
  private privy?: PrivyLike;
  private resolvedWalletId?: string;
  private resolvedAddress?: string;
  private mockNonce = 0;

  constructor(opts: PrivyWalletProviderOptions = {}) {
    this.config = opts.config ?? resolvePrivyConfig(opts.env);
    this.mode = this.config.mode;
    this.chain = toViemChain(this.config.chain);
    this.label = opts.label ?? "actflow-agent";
    if (this.config.walletId) this.resolvedWalletId = this.config.walletId;
  }

  // -- shared helpers ------------------------------------------------------

  private getPublicClient(): PublicClient {
    if (!this.publicClient) {
      this.publicClient = createPublicClient({
        chain: this.chain,
        transport: http(this.config.chain.rpcUrl, { timeout: 15_000, retryCount: 1 }),
      });
    }
    return this.publicClient;
  }

  /** Lazily import + construct the Privy SDK client (live mode only). */
  private async getPrivy(): Promise<PrivyLike> {
    if (this.privy) return this.privy;
    const creds = this.config.creds;
    if (!creds) {
      throw new Error("PrivyWalletProvider is in mock mode — no Privy client.");
    }
    // Dynamic import: keeps mock-only environments from needing the SDK.
    const mod: any = await import("@privy-io/node");
    const PrivyClient = mod.PrivyClient;
    this.privy = new PrivyClient({
      appId: creds.appId,
      appSecret: creds.appSecret,
    }) as PrivyLike;
    return this.privy;
  }

  private authContext():
    | { authorization_private_keys: string[] }
    | undefined {
    const key = this.config.creds?.authorizationKey;
    return key ? { authorization_private_keys: [key] } : undefined;
  }

  /** Ensure a live server wallet exists; create one if no walletId is configured. */
  private async ensureLiveWallet(): Promise<{ id: string; address: string }> {
    const privy = await this.getPrivy();
    if (this.resolvedWalletId && this.resolvedAddress) {
      return { id: this.resolvedWalletId, address: this.resolvedAddress };
    }
    if (this.resolvedWalletId) {
      const w = await privy.wallets().get(this.resolvedWalletId);
      this.resolvedWalletId = w.id;
      this.resolvedAddress = w.address;
      return { id: w.id, address: w.address };
    }
    const created = await privy.wallets().create({
      chain_type: "ethereum",
      display_name: this.label,
    });
    this.resolvedWalletId = created.id;
    this.resolvedAddress = created.address;
    return { id: created.id, address: created.address };
  }

  private ensureMockWallet(): MockWalletHandle {
    if (!this.mockWallet) this.mockWallet = createMockWallet(this.label);
    return this.mockWallet;
  }

  // -- IWalletProvider -----------------------------------------------------

  async getAddress(): Promise<string> {
    if (this.mode === "mock") return this.ensureMockWallet().address;
    const { address } = await this.ensureLiveWallet();
    return address;
  }

  async getBalance(token = "USDC"): Promise<WalletBalance> {
    if (this.mode === "mock") {
      // Deterministic, clearly-fake balance — never presented as real funds.
      return { symbol: token, amount: "0.00", mock: true };
    }
    const { address } = await this.ensureLiveWallet();
    const client = this.getPublicClient();
    const [raw, decimals] = await Promise.all([
      client.readContract({
        address: this.config.chain.usdcAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      }),
      client
        .readContract({
          address: this.config.chain.usdcAddress,
          abi: ERC20_ABI,
          functionName: "decimals",
        })
        .catch(() => this.config.chain.usdcDecimals),
    ]);
    return { symbol: token, amount: formatUnits(raw, Number(decimals)) };
  }

  async pay(request: PaymentRequest): Promise<PaymentResult> {
    const token = request.token ?? "USDC";
    if (this.mode === "mock") {
      const wallet = this.ensureMockWallet();
      const hash = mockTxHash(
        wallet.address,
        request.to,
        request.amount,
        token,
        this.mockNonce++,
      );
      return { txHash: hash, mock: true };
    }

    // LIVE: encode a USDC ERC-20 transfer and submit via Privy sendTransaction.
    // Arc native gas is USDC, deducted automatically — no separate gas funding.
    const { id } = await this.ensureLiveWallet();
    const privy = await this.getPrivy();
    const value = parseUnits(request.amount, this.config.chain.usdcDecimals);
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [request.to as `0x${string}`, value],
    });
    const tx = await privy.wallets().ethereum().sendTransaction(id, {
      caip2: this.config.chain.caip2,
      params: {
        transaction: {
          to: this.config.chain.usdcAddress,
          data,
          chain_id: this.config.chain.chainId,
        },
      },
      authorization_context: this.authContext(),
    });
    return { txHash: tx.hash };
  }
}

/** Convenience factory. */
export function createPrivyWalletProvider(
  opts: PrivyWalletProviderOptions = {},
): PrivyWalletProvider {
  return new PrivyWalletProvider(opts);
}
