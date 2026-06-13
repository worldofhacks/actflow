/**
 * withdrawEarningsPrivately — route an agent's marketplace earnings through the
 * Unlink privacy SDK so the payout amount/recipient are shielded.
 *
 * BEFORE: agent earnings settle as plain USDC transfers on Arc — amount + payee
 * are fully public on-chain (`ActMarketplaceEVM.withdraw()` proceeds land in the
 * agent's wallet, then a public transfer pays the owner).
 *
 * AFTER (this helper): the same `withdraw()` proceeds are routed through
 * @actflow/integrations-unlink:
 *   1. privateDeposit()  — shield the proceeds into a private Unlink balance,
 *   2. privateTransfer() — pay the owner's `unlink1…` address (amount/parties
 *      hidden by a zero-knowledge proof),
 *   3. privateWithdraw() — OPTIONAL cash-out of a remainder to a public EVM
 *      address.
 *
 * OPTIONAL + MOCK-SAFE: with no Unlink creds the wrapper runs in its labeled
 * mock mode (every receipt `mock:true`), so this builds, tests, and demos with
 * no account/API key/funds. Real private transfers activate when
 * UNLINK_API_KEY + UNLINK_MNEMONIC are set and @unlink-xyz/sdk loads.
 *
 * ARCHITECTURE: @actflow/agents depends on @actflow/integrations-unlink (one
 * direction). The unlink package depends only on @actflow/sdk, never on agents —
 * so there is no dependency cycle.
 */
import {
  createUnlinkPayout,
  type UnlinkPayout,
  type UnlinkReceipt,
} from "@actflow/integrations-unlink";

export interface WithdrawEarningsPrivatelyInput {
  /**
   * The marketplace `withdraw()` proceeds to shield, in the token's smallest
   * unit (decimal string; Arc USDC is 6 decimals, so "1000000" = 1 USDC).
   */
  proceeds: string;
  /** The agent owner's Unlink private address ("unlink1…") to pay privately. */
  ownerUnlinkAddress: string;
  /**
   * Amount to privately transfer to the owner, in base units. Defaults to the
   * full `proceeds` (transfer everything that was deposited).
   */
  transferAmount?: string;
  /**
   * OPTIONAL cash-out: withdraw this amount (base units) to a public EVM
   * address after the private transfer. Requires `cashOutEvmAddress`.
   */
  cashOutAmount?: string;
  /** Public EVM destination for the optional cash-out ("0x…"). */
  cashOutEvmAddress?: string;
  /** Optional token override; defaults to the wrapper's configured token. */
  token?: string;
}

export interface WithdrawEarningsPrivatelyResult {
  /** "live" when a real Unlink client is used; "mock" otherwise. */
  mode: "live" | "mock";
  /** Receipt for the deposit (public -> private). */
  deposit: UnlinkReceipt;
  /** Receipt for the private transfer to the owner. */
  transfer: UnlinkReceipt;
  /** Receipt for the optional public cash-out, when requested. */
  withdraw?: UnlinkReceipt;
  /**
   * True when every step ran in mock mode (no real funds moved). Carried through
   * from the wrapper's receipts — never invented here. The whole flow is treated
   * as mock if ANY receipt is mock, so it is never presented as a real payout.
   */
  mock: boolean;
}

export interface WithdrawEarningsPrivatelyOptions {
  /**
   * Inject a pre-built UnlinkPayout (tests / custom config). Defaults to
   * createUnlinkPayout() which reads UNLINK_* from the environment.
   */
  payout?: UnlinkPayout;
  /** Inject an env object (tests). Ignored when `payout` is given. */
  env?: NodeJS.ProcessEnv;
}

/**
 * Shield an agent's marketplace earnings via Unlink: deposit -> private transfer
 * to the owner -> optional public cash-out. Mock-safe (labeled mock receipts
 * when no Unlink creds are configured).
 */
export async function withdrawEarningsPrivately(
  input: WithdrawEarningsPrivatelyInput,
  options: WithdrawEarningsPrivatelyOptions = {},
): Promise<WithdrawEarningsPrivatelyResult> {
  const payout =
    options.payout ?? createUnlinkPayout({ env: options.env });

  if (input.cashOutAmount && !input.cashOutEvmAddress) {
    throw new Error(
      "cashOutEvmAddress is required when cashOutAmount is set.",
    );
  }

  // 1) Shield the withdraw() proceeds into the agent's private balance.
  const deposit = await payout.privateDeposit({
    amount: input.proceeds,
    token: input.token,
  });

  // 2) Private transfer to the owner (defaults to the full proceeds).
  const transfer = await payout.privateTransfer({
    toUnlinkAddress: input.ownerUnlinkAddress,
    amount: input.transferAmount ?? input.proceeds,
    token: input.token,
  });

  // 3) Optional public cash-out of a remainder.
  let withdraw: UnlinkReceipt | undefined;
  if (input.cashOutAmount && input.cashOutEvmAddress) {
    withdraw = await payout.privateWithdraw({
      toEvmAddress: input.cashOutEvmAddress,
      amount: input.cashOutAmount,
      token: input.token,
    });
  }

  const mock =
    deposit.mock === true ||
    transfer.mock === true ||
    (withdraw?.mock === true);

  return {
    // payout.mode reflects the resolved/downgraded mode after the first op.
    mode: payout.mode,
    deposit,
    transfer,
    withdraw,
    mock,
  };
}
