import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { loadSdk } from './x402.loader';

/**
 * Payments configuration for the x402/Arc USDC layer.
 *
 * Chain id, USDC address/decimals and the explorer base all come from @actflow/sdk
 * (arcTestnet / ARC_TESTNET_USDC / ARC_TESTNET_EXPLORER_URL) — NOTHING is hard-coded here.
 * Operational knobs (escrow recipient fallback, default price, challenge ttl, force-mock)
 * are read from env via the existing @nestjs/config pattern.
 *
 * Env mapping (all OPTIONAL so the API boots with no payment config):
 *   PAYMENTS_ESCROW_ADDRESS   - fallback payee when a hire request omits agentAddress
 *   PAYMENTS_DEFAULT_PRICE    - default USDC price (decimal string) when none supplied
 *   PAYMENTS_CHALLENGE_TTL    - seconds a 402 challenge stays valid (default 600)
 *   X402_FORCE_MOCK           - force the labeled MOCK settlement path (no funds/keys)
 *   ARC_TESTNET_RPC_URL / ARC_CHAIN_ID / ARC_USDC_ADDRESS - x402 package env overrides
 */
@Injectable()
export class PaymentsConfig {
  constructor(private readonly configService: ConfigService) {}

  /** Arc testnet chain id (from SDK; default 5042002). */
  get chainId(): number {
    return loadSdk().ARC_TESTNET_CHAIN_ID;
  }

  /** Arc USDC ERC-20 address (from SDK). */
  get usdcAddress(): `0x${string}` {
    return loadSdk().ARC_TESTNET_USDC.address;
  }

  /** Arc USDC decimals (6, from SDK). */
  get usdcDecimals(): number {
    return loadSdk().ARC_TESTNET_USDC.decimals;
  }

  /** Explorer base url (from SDK), used to build tx links for real settlements. */
  get explorerBaseUrl(): string {
    return loadSdk().ARC_TESTNET_EXPLORER_URL;
  }

  /** Build the Arc explorer URL for a settlement tx hash (real txs only). */
  explorerTxUrl(txHash?: string): string | undefined {
    if (!txHash) return undefined;
    return `${this.explorerBaseUrl.replace(/\/+$/, '')}/tx/${txHash}`;
  }

  /** Optional escrow/treasury address used as the payee when no agentAddress is supplied. */
  get escrowAddress(): string | undefined {
    const v = this.configService.get<string>('PAYMENTS_ESCROW_ADDRESS');
    return v && v.trim() ? v.trim() : undefined;
  }

  /** Default price (USDC decimal string) when a hire request omits one. */
  get defaultPrice(): string | undefined {
    const v = this.configService.get<string>('PAYMENTS_DEFAULT_PRICE');
    return v && v.trim() ? v.trim() : undefined;
  }

  /** Challenge validity window in seconds (default 600 = 10 minutes). */
  get challengeTtlSeconds(): number {
    const raw = this.configService.get<string>('PAYMENTS_CHALLENGE_TTL');
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 600;
  }

  /**
   * Whether settlement is forced into the labeled MOCK path. True when X402_FORCE_MOCK is
   * set OR when no funded settler is configured (the default in this environment — no Arc
   * funds / Privy creds). The x402 verifyPayment also returns mock when no settler is given;
   * this flag lets the service surface mock:true coherently to callers/UI.
   */
  get forceMock(): boolean {
    const v = this.configService.get<string>('X402_FORCE_MOCK');
    if (!v) return false;
    const t = v.trim().toLowerCase();
    return t === '1' || t === 'true' || t === 'yes' || t === 'on';
  }
}
