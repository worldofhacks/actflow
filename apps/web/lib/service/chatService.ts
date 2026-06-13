'use server';
import { AgentDetails } from '@/types/agent/agent';
import { fetchWithAuth } from '.';
import { GeneralApiResponse } from '../../types/api-response';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function sendMessageToTheAgent(
  agentId: string,
  message: string,
): Promise<GeneralApiResponse<AgentDetails[]>> {
  const url = `${API_BASE}/native-agent/${agentId}/message`;
  console.log('url', url);
  return fetchWithAuth<AgentDetails[]>(url, {
    method: 'POST',
    body: JSON.stringify({ text: message, userId: '', userName: '' }),
  });
}
