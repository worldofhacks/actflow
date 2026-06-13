'use server';

// import { ContractTransaction } from '@/types/transactions/transaction';
import { GeneralApiResponse } from '../../types/api-response';
import { fetchWithAuth } from './index';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const ENDPOINTS = {
  MY_TRANSACTIONS: `${API_BASE}/transactions/my-transactions`,
};

export async function getMyTransactions(): Promise<GeneralApiResponse<object[]>> {
  return fetchWithAuth<object[]>(ENDPOINTS.MY_TRANSACTIONS, {
    method: 'GET',
  });
}
