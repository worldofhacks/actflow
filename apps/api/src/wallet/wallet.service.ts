import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

/**
 * Minimal ERC-20 surface used for the revenue token.
 * (The Story Protocol SDK / WIP-token wrap+unwrap paths were removed during the
 * monorepo port; balances and approvals now go through plain ethers calls against
 * REVENUE_TOKEN_ADDRESS.)
 */
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

@Injectable()
export class WalletService {
  private provider: ethers.Provider;
  private marketContractAddress: string;
  private revenueTokenAddress: string;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('NETWORK_RPC_URL');
    const chainId = this.configService.get<string>('CHAIN_ID');

    this.provider = new ethers.JsonRpcProvider(rpcUrl, {
      chainId: Number(chainId),
      name: 'actflow-network',
    });

    this.marketContractAddress = this.configService.get<string>('ACT_MARKET_ADDRESS');
    this.revenueTokenAddress = this.configService.get<string>('REVENUE_TOKEN_ADDRESS');
  }

  generateWallet(): {
    privateKey: string;
    publicKey: string;
  } {
    const wallet = ethers.Wallet.createRandom();

    return {
      privateKey: wallet.privateKey,
      publicKey: wallet.address,
    };
  }

  async getNativeBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching native balance:', error);
      throw new Error('Failed to fetch native token balance');
    }
  }

  /**
   * ERC-20 balance of the revenue token (REVENUE_TOKEN_ADDRESS) for `address`.
   */
  async getTokenBalance(address: string): Promise<string> {
    try {
      const token = new ethers.Contract(this.revenueTokenAddress, ERC20_ABI, this.provider);
      const balance: bigint = await token.balanceOf(address);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      throw new Error('Failed to fetch token balance');
    }
  }

  /**
   * Approve the marketplace contract to spend the revenue token on behalf of the wallet.
   */
  async approveMarketplace(privateKey: string, amount: bigint) {
    return this.approveSpender(privateKey, this.marketContractAddress, amount);
  }

  async approveToken(privateKey: string, spenderAddress: string, amount: string) {
    const amountInWei = ethers.parseUnits(amount, 18);
    return this.approveSpender(privateKey, spenderAddress, amountInWei);
  }

  private async approveSpender(privateKey: string, spender: string, amount: bigint) {
    try {
      const signer = new ethers.Wallet(privateKey, this.provider);
      const token = new ethers.Contract(this.revenueTokenAddress, ERC20_ABI, signer);

      const tx = await token.approve(spender, amount);
      await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        message: 'Approval transaction submitted successfully',
      };
    } catch (error) {
      console.error('Error approving tokens:', error);
      throw new Error('Failed to approve tokens: ' + error.message);
    }
  }

  getAddressFromPrivateKey(privateKey: string): string {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  }
}
