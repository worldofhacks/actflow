'use server';

import { User } from '@/types/user';
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginResponse,
  ResetPasswordRequest,
} from '../../types/auth';
import { fetchWithAuth, fetchWithOutAuth } from './index';

// NOTE: roles are intentionally NOT sent from the client — the backend assigns
// the default role on registration (client-supplied roles are a privilege
// escalation vector).
export const registerUser = async (body: {
  username: string;
  name: string;
  email: string;
  password: string;
  referrer?: string;
}) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/register`;
  const response = await fetchWithOutAuth<LoginResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response;
};

export const forgotPassword = async (body: ForgotPasswordRequest) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`;
  const response = await fetchWithOutAuth<ForgotPasswordResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response;
};

export const resetPassword = async (body: ResetPasswordRequest) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`;
  return await fetchWithOutAuth<User>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const checkIfTheWalletAccountExists = async (walletAddress: string) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/wallet/check`;
  return fetchWithOutAuth<{ success: boolean; user: User | null }>(url, {
    method: 'POST',
    body: JSON.stringify({ address: walletAddress }),
  });
};

export const verifyEmail = async (email: string, verificationCode: string) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`;
  return await fetchWithOutAuth<LoginResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ email, verificationCode }),
  });
};

export const resendVerificationEmail = async (email: string) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`;
  return await fetchWithOutAuth<LoginResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};
// NOTE: roles are intentionally NOT sent from the client — the backend assigns
// the default role on registration.
export const registerUserByWallet = async (
  walletAddress: string,
  email: string,
  username: string,
  name: string,
  referrer?: string,
) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/wallet/register`;
  const response = await fetchWithOutAuth<LoginResponse>(url, {
    method: 'POST',
    body: JSON.stringify({
      address: walletAddress,
      email,
      username,
      name,
      ...(referrer && { referrer }),
    }),
  });
  return response;
};

/**
 * Refresh the access token
 * @returns the new access token
 */
export async function refreshToken(refreshToken: string) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`;
  return await fetchWithOutAuth<LoginResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logout(refreshToken: string) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`;
  return await fetchWithAuth<{ success: boolean }>(url, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

/**
 * Logout all sessions of the user
 * @returns the response from the server
 */
export async function logoutAllSessions() {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/logout-all`;
  return await fetchWithAuth<{ success: boolean }>(url, {
    method: 'POST',
  });
}
