/**
 * IWalletProvider — the contract between agent wallet tools and whatever
 * wallet backend the deployment uses (Privy server wallets, a raw ethers v6
 * signer, etc.). Phase 4 wires a live implementation.
 */

export interface WalletBalance {
  /** Token symbol, e.g. "USDC" or "ETH". */
  symbol: string;
  /** Decimal string amount, e.g. "12.50". */
  amount: string;
  /** Always true for the mock implementation — never set by live providers. */
  mock?: boolean;
}

export interface PaymentRequest {
  /** Recipient address (0x-prefixed EVM address). */
  to: string;
  /** Decimal string amount. */
  amount: string;
  /** Token symbol; defaults to USDC for marketplace payouts. */
  token?: string;
}

export interface PaymentResult {
  txHash: string;
  /** Always true for the mock implementation — never set by live providers. */
  mock?: boolean;
}

export interface IWalletProvider {
  getAddress(): Promise<string>;
  getBalance(token?: string): Promise<WalletBalance>;
  pay(request: PaymentRequest): Promise<PaymentResult>;
}

/**
 * MOCK wallet provider — clearly-marked stub. Holds no keys, signs nothing.
 */
export class MockWalletProvider implements IWalletProvider {
  async getAddress(): Promise<string> {
    return "0x0000000000000000000000000000000000000000";
  }

  async getBalance(token = "USDC"): Promise<WalletBalance> {
    return { symbol: token, amount: "0.00", mock: true };
  }

  async pay(request: PaymentRequest): Promise<PaymentResult> {
    void request;
    return { txHash: "0xMOCK_PAYMENT", mock: true };
  }
}
