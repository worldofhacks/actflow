'use server';

import { TokenAllowance } from '@/types/user';
import { GeneratedWallet, Wallet } from '@/types/user/wallet';
import { fetchWithAuth } from '.';
import { GeneralApiResponse } from '../../types/api-response';

export async function generateWallet(name: string) {
  const response = await fetchWithAuth<GeneratedWallet>(
    `${process.env.NEXT_PUBLIC_API_URL}/wallet/generate`,
    {
      method: 'POST',
      body: JSON.stringify({ name }),
    },
  );

  return response;
}

/**
 * Fetch the wallet balance of a given wallet address
 * @param walletAddress - the address of the wallet to fetch the balance of
 * @returns wallet balance info
 */
export async function checkWalletBallance(
  walletAddress: string,
): Promise<GeneralApiResponse<Wallet>> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/wallet/wallet-info/${walletAddress}`;
  const response = await fetchWithAuth<Wallet>(url, {
    method: 'GET',
  });

  return response;
}

/**
 * Fetch all the wallet related information of current user's wallets
 * @returns array of wallets info
 */
export async function getAllUserWalletsInfo() {
  const response = await fetchWithAuth<Wallet[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/wallet/my-wallets`,
    {
      method: 'GET',
    },
  );

  return response;
}

export async function approveMarketplaceContract(walletAddress: string) {
  const response = await fetchWithAuth<TokenAllowance>(
    `${process.env.NEXT_PUBLIC_API_URL}/wallet/max-allowance`,
    {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
      }),
    },
  );

  return response;
}

/**
 * Deposit WIP to a given wallet address
 * @param walletAddress - the address of the wallet to deposit WIP to
 * @param amount - the amount of WIP to deposit
 * @returns transaction hash
 */
export async function depositWIP(walletAddress: string, amount: string) {
  const response = await fetchWithAuth<TokenAllowance>(
    `${process.env.NEXT_PUBLIC_API_URL}/wallet/depositWIP`,
    {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        amount,
      }),
    },
  );

  return response;
}
