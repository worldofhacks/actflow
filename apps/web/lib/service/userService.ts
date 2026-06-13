'use server';

import { Provider } from '@/types/auth';
import { TopReferralUser, User } from '@/types/user';
import { fetchWithAuth } from '.';
import { GeneralApiResponse } from '../../types/api-response';

export async function getCurrentUser(): Promise<GeneralApiResponse<User>> {
  return fetchWithAuth<User>(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
    method: 'GET',
  });
}

export async function updateUserProfile(
  data: Partial<{
    userId: string;
    name: string;
    email: string;
    provider: Provider;
    referralCode: string;
  }>,
) {
  return fetchWithAuth<User>(`${process.env.NEXT_PUBLIC_API_URL}/users/${data.userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function getTopReferralUsers(selectedPeriod: 'weekly' | 'monthly' | 'allTime') {
  let url = `${process.env.NEXT_PUBLIC_API_URL}/users/top-referral-users?limit=10&sort=referralCount`;

  if (selectedPeriod !== 'allTime') {
    const endDate = new Date();
    const startDate = new Date();

    if (selectedPeriod === 'weekly') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (selectedPeriod === 'monthly') {
      startDate.setDate(endDate.getDate() - 30);
    }

    url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
  }

  return fetchWithAuth<TopReferralUser[]>(url, {
    method: 'GET',
  });
}

export async function getUserRank(userId: string): Promise<GeneralApiResponse<{ rank: number }>> {
  return await fetchWithAuth<{ rank: number }>(
    `${process.env.NEXT_PUBLIC_API_URL}/users/user-rank/${userId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

export async function getUserRewardsProgress() {
  return await fetchWithAuth<{
    dailyStreak: number;
    monthlyReferrals: number;
    totalReferrals: number;
  }>(`${process.env.NEXT_PUBLIC_API_URL}/users/get-reward-progress`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function unlinkAccount() {
  return await fetchWithAuth(
    `${process.env.NEXT_PUBLIC_API_URL}/users/linked-accounts/unlink-all`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

export async function unlinkTwitterAccount(): Promise<GeneralApiResponse<User>> {
  return await fetchWithAuth(
    `${process.env.NEXT_PUBLIC_API_URL}/users/linked-accounts/twitter`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

export async function getTweetsCountAboutACTFlow() {
  const response = await fetchWithAuth<{
    count: number;
    total_tweets: number;
    meta: {
      message: string;
      stored_count: boolean;
    };
  }>(`${process.env.NEXT_PUBLIC_API_URL}/twitter/act-flow-tweets/count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}

export async function updateReferrerInformation(referrer: string) {
  return await fetchWithAuth<User>(
    `${process.env.NEXT_PUBLIC_API_URL}/users/update-referrer-info`,
    {
      method: 'PATCH',
      body: JSON.stringify({ referrer }),
    },
  );
}

export async function createReferralCode(referralCode: string) {
  return await fetchWithAuth<User>(
    `${process.env.NEXT_PUBLIC_API_URL}/users/create-referral-code`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ referralCode }),
    },
  );
}
