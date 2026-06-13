/**
 * UnlinkPayout — a thin wrapper that routes ActFlow agent earnings through the
 * Unlink privacy SDK so the payout amount/parties are shielded.
 *
 * Flow (the hackathon brief): an agent's marketplace withdraw() proceeds are
 *   1) deposit()ed into a private Unlink balance (public: funder + amount),
 *   2) transfer()ed privately to the owner's `unlink1…` address (all hidden),
 *   3) optionally withdraw()n to a public EVM address when cashing out.
 *
 * Two modes, decided by resolveUnlinkConfig() AND whether the optional SDK loads:
 *  - LIVE  (UNLINK_API_KEY + UNLINK_MNEMONIC present AND @unlink-xyz/sdk loads):
 *    builds an admin + custodial client per the SKILL's SERVER pattern
 *    (account.fromMnemonic, createUnlinkAdmin, createUnlinkClient) on the
 *    configured environment (Arc Testnet by default) and calls the real
 *    depositWithApproval / transfer / withdraw primitives.
 *  - MOCK  (creds absent, UNLINK_FORCE_MOCK set, or the SDK can't load):
 *    returns deterministic, clearly-labeled receipts (mock:true). No account,
 *    API key, or funds required — build + tests pass offline.
 *
 * The @unlink-xyz/sdk is imported DYNAMICALLY and is an OPTIONAL dependency, so
 * this module type-checks and runs with the SDK absent. Secrets are never logged.
 */
import {
  resolveUnlinkConfig,
  type UnlinkConfig,
} from "./config.js";
import { mockReceipt, type UnlinkReceipt } from "./mock.js";

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
/** Decimal string in the token's smallest unit (the SDK's "wei"). */
const BASE_UNITS = /^\d+$/;
/** Unlink private address format, per the SKILL (transfer.md). */
const UNLINK_ADDRESS = /^unlink1[0-9a-z]+$/;

export interface UnlinkPayoutOptions {
  /** Override resolved config (e.g. for tests). */
  config?: UnlinkConfig;
  /** Inject an env object (tests). Ignored when `config` is given. */
  env?: NodeJS.ProcessEnv;
}

export interface PrivateDepositInput {
  /** Amount in the token's smallest unit (decimal string, e.g. "1000000"). */
  amount: string;
  /** Optional token override; defaults to the configured token. */
  token?: string;
}

export interface PrivateTransferInput {
  /** Destination Unlink private address ("unlink1…"). */
  toUnlinkAddress: string;
  /** Amount in the token's smallest unit (decimal string). */
  amount: string;
  /** Optional token override; defaults to the configured token. */
  token?: string;
}

export interface PrivateWithdrawInput {
  /** Public EVM destination address ("0x…"). */
  toEvmAddress: string;
  /** Amount in the token's smallest unit (decimal string). */
  amount: string;
  /** Optional token override; defaults to the configured token. */
  token?: string;
}

/**
 * Minimal STRUCTURAL view of the @unlink-xyz/sdk pieces we use. Kept local so
 * this package type-checks WITHOUT the optional SDK installed; the dynamic
 * import is cast to these shapes. Field names match the SDK (see the
 * unlink-privacy SKILL + the SDK's .d.ts).
 */
interface TxResultLike {
  txId: string;
  status: string;
  txHash?: string | null;
}
interface TxHandleLike {
  txId: string;
  status: string;
  txHash: string | null;
  wait(opts?: { timeoutMs?: number; intervalMs?: number }): Promise<TxResultLike>;
}
interface UnlinkClientLike {
  ensureRegistered(): Promise<void>;
  depositWithApproval(params: {
    token: string;
    amount: string;
  }): Promise<TxHandleLike>;
  transfer(params: {
    recipientAddress: string;
    token: string;
    amount: string;
  }): Promise<TxHandleLike>;
  withdraw(params: {
    recipientEvmAddress: string;
    token: string;
    amount: string;
  }): Promise<TxHandleLike>;
}
interface UnlinkAdminLike {
  users: { register(payload: unknown): Promise<unknown> };
  authorizationTokens: {
    issue(args: { unlinkAddress: string }): Promise<unknown>;
  };
}
interface UnlinkClientModuleLike {
  account: {
    fromMnemonic(opts: {
      mnemonic: string;
      accountIndex?: number;
    }): { getAddress(): Promise<string> };
  };
  createUnlinkClient(opts: unknown): UnlinkClientLike;
}
interface UnlinkAdminModuleLike {
  createUnlinkAdmin(opts: { environment: string; apiKey: string }): UnlinkAdminLike;
}

function validateAmount(amount: string): void {
  if (!BASE_UNITS.test(amount) || amount === "0") {
    throw new Error(
      `amount must be a positive decimal string in the token's smallest unit (got "${amount}").`,
    );
  }
}

export class UnlinkPayout {
  readonly mode: "live" | "mock";
  private readonly config: UnlinkConfig;
  private client?: UnlinkClientLike;
  /** Resolved once the live client registers; the agent's own unlink1 address. */
  private selfUnlinkAddress?: string;

  constructor(opts: UnlinkPayoutOptions = {}) {
    this.config = opts.config ?? resolveUnlinkConfig(opts.env);
    this.mode = this.config.mode;
  }

  /** The configured target chain id (e.g. 5042002 for Arc Testnet). */
  get chainId(): number {
    return this.config.chain.chainId;
  }

  /** The Unlink SDK `environment` string in use (e.g. "arc-testnet"). */
  get environment(): string {
    return this.config.chain.environment;
  }

  /** The ERC-20 token address being shielded. */
  get token(): string {
    return this.config.chain.token;
  }

  /**
   * Lazily build the live Unlink client (admin + custodial account) per the
   * SKILL's SERVER pattern. The SDK is dynamically imported; if it can't load,
   * we DOWNGRADE to mock rather than throw, so a missing/broken optional dep
   * never breaks a payout — it just becomes a labeled mock.
   *
   * Returns the live client, or `null` to signal "use the mock path".
   */
  private async getClient(): Promise<UnlinkClientLike | null> {
    if (this.mode !== "live" || !this.config.creds) return null;
    if (this.client) return this.client;

    let clientMod: UnlinkClientModuleLike;
    let adminMod: UnlinkAdminModuleLike;
    try {
      // Dynamic import keeps the package buildable/testable without the optional
      // canary dep. Specifiers are computed so tsc/bundlers don't hard-require it.
      const clientSpec = "@unlink-xyz/sdk/client";
      const adminSpec = "@unlink-xyz/sdk/admin";
      clientMod = (await import(clientSpec)) as unknown as UnlinkClientModuleLike;
      adminMod = (await import(adminSpec)) as unknown as UnlinkAdminModuleLike;
    } catch {
      // Optional SDK absent/broken -> downgrade to mock for this instance.
      this.downgradeToMock();
      return null;
    }

    const { apiKey, mnemonic, accountIndex } = this.config.creds;
    const environment = this.config.chain.environment;

    const admin = adminMod.createUnlinkAdmin({ environment, apiKey });
    const unlinkAccount = clientMod.account.fromMnemonic({ mnemonic, accountIndex });
    const unlinkAddress = await unlinkAccount.getAddress();
    this.selfUnlinkAddress = unlinkAddress;

    const client = clientMod.createUnlinkClient({
      environment,
      account: unlinkAccount,
      register: (payload: unknown) => admin.users.register(payload),
      authorizationToken: {
        provider: () => admin.authorizationTokens.issue({ unlinkAddress }),
      },
    });
    await client.ensureRegistered();
    this.client = client;
    return client;
  }

  /** Flip this instance to mock mode (used when the optional SDK can't load). */
  private downgradeToMock(): void {
    // `mode` is readonly to callers; mutate the private backing via a cast so
    // subsequent ops use the mock path. Safe: only narrows live -> mock.
    (this as { mode: "live" | "mock" }).mode = "mock";
  }

  // -- private primitives --------------------------------------------------

  /** Deposit public funds into the agent's private Unlink balance. */
  async privateDeposit(input: PrivateDepositInput): Promise<UnlinkReceipt> {
    validateAmount(input.amount);
    const token = input.token ?? this.config.chain.token;

    const client = await this.getClient();
    if (!client) return mockReceipt("deposit", [token, input.amount]);

    const handle = await client.depositWithApproval({ token, amount: input.amount });
    return toReceipt("deposit", handle);
  }

  /** Private transfer to the owner's Unlink address (sender/recipient/amount hidden). */
  async privateTransfer(input: PrivateTransferInput): Promise<UnlinkReceipt> {
    validateAmount(input.amount);
    if (!UNLINK_ADDRESS.test(input.toUnlinkAddress)) {
      throw new Error(
        `toUnlinkAddress must be an "unlink1…" private address (got "${input.toUnlinkAddress}").`,
      );
    }
    const token = input.token ?? this.config.chain.token;

    const client = await this.getClient();
    if (!client) {
      return mockReceipt("transfer", [input.toUnlinkAddress, token, input.amount]);
    }

    const handle = await client.transfer({
      recipientAddress: input.toUnlinkAddress,
      token,
      amount: input.amount,
    });
    return toReceipt("transfer", handle);
  }

  /** Withdraw from the private balance to a public EVM address (cash out). */
  async privateWithdraw(input: PrivateWithdrawInput): Promise<UnlinkReceipt> {
    validateAmount(input.amount);
    if (!EVM_ADDRESS.test(input.toEvmAddress)) {
      throw new Error(
        `toEvmAddress must be a 0x-prefixed EVM address (got "${input.toEvmAddress}").`,
      );
    }
    const token = input.token ?? this.config.chain.token;

    const client = await this.getClient();
    if (!client) {
      return mockReceipt("withdraw", [input.toEvmAddress, token, input.amount]);
    }

    const handle = await client.withdraw({
      recipientEvmAddress: input.toEvmAddress,
      token,
      amount: input.amount,
    });
    return toReceipt("withdraw", handle);
  }
}

/**
 * Await a live TransactionHandle to a terminal status and shape it into a
 * labeled (non-mock) receipt. If wait() times out/throws, we still return the
 * accepted handle's id + status (the tx may land later) rather than fabricate one.
 */
async function toReceipt(
  op: UnlinkReceipt["op"],
  handle: TxHandleLike,
): Promise<UnlinkReceipt> {
  try {
    const res = await handle.wait();
    return {
      op,
      txId: res.txId,
      status: res.status,
      txHash: res.txHash ?? null,
    };
  } catch {
    // Timeout / transient error: surface the accepted handle as-is (no mock flag —
    // this is a real, accepted-but-unconfirmed Unlink transaction).
    return { op, txId: handle.txId, status: handle.status, txHash: handle.txHash };
  }
}

/** Convenience factory. */
export function createUnlinkPayout(opts: UnlinkPayoutOptions = {}): UnlinkPayout {
  return new UnlinkPayout(opts);
}
