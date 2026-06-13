'use server';

import { AgentDetails } from '@/types/agent/agent';
import { GeneralApiResponse } from '@/types/api-response';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { fetchWithAuth } from '.';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface Notification {
  // Add properties based on your Notification schema
  _id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
  // Add other necessary properties
}

interface TransactionHistoryItem {
  // Add properties based on your TransactionHistoryItem type
  _id: string;
  eventName: string;
  amount?: string;
  timestamp: string;
  // Add other necessary properties
}

export interface SellerDashboardResponse {
  activeAgents: number;
  averageRating: number;
  performanceOverview: {
    totalEarnings: string;
    totalTasks: number;
  };
  recentTransactions: TransactionHistoryItem[];
  recentNotifications: Notification[];
}

export interface BuyerDashboardResponse {
  walletBalance: string;
  recentTransactions: TransactionHistoryItem[];
  recentNotifications: Notification[];
  myTasks: TaskDetails[];
  performanceOverview: {
    openDisputes: number;
    totalSpending: string;
    totalTasks: number;
  };
  recommendedAgents: AgentDetails[];
}

interface Payment {
  _id: string;
  amount: string;
  status: string;
  timestamp: string;
  // Add other necessary properties
}

interface Refund {
  _id: string;
  amount: string;
  status: string;
  timestamp: string;
  // Add other necessary properties
}

export interface FinancialDashboardResponse {
  escrowedTransactions: TransactionHistoryItem[];
  activePayments: Payment[];
  completedPayments: Payment[];
  availableBalance: string;
  activeDisputes: number;
  pendingRefunds: Refund[];
  pastRefunds: Refund[];
}

export async function getSellerDashboard(): Promise<GeneralApiResponse<SellerDashboardResponse>> {
  return fetchWithAuth<SellerDashboardResponse>(`${API_BASE}/dashboard/seller`, {
    method: 'GET',
  });
}

export async function getBuyerDashboard(): Promise<GeneralApiResponse<BuyerDashboardResponse>> {
  return fetchWithAuth<BuyerDashboardResponse>(`${API_BASE}/dashboard/buyer`, {
    method: 'GET',
  });
}

export async function getFinancialDashboard(): Promise<
  GeneralApiResponse<FinancialDashboardResponse>
> {
  return fetchWithAuth<FinancialDashboardResponse>(`${API_BASE}/dashboard/financial`, {
    method: 'GET',
  });
}
