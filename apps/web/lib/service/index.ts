import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth.config';
import { createErrorResponse, GeneralApiResponse } from '../../types/api-response';

async function baseFetch<T>(url: string, options: RequestInit): Promise<GeneralApiResponse<T>> {
  const response = await fetch(url, options);
  if (!response) {
    return createErrorResponse('No response received', 0);
  }

  const result = (await response.json()) as GeneralApiResponse<T>;
  return result;
}

export async function fetchWithAuth<T>(
  url: string,
  options: RequestInit,
): Promise<GeneralApiResponse<T>> {
  const session = await getServerSession(authOptions);

  const mergedOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.user?.accessToken}`,
      ...options.headers,
    },
  };
  return baseFetch<T>(url, mergedOptions);
}

export async function fetchWithOutAuth<T>(
  url: string,
  options: RequestInit,
): Promise<GeneralApiResponse<T>> {
  const mergedOptions = {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  };

  return baseFetch<T>(url, mergedOptions);
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL;
