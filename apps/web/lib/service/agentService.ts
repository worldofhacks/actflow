'use server';

import { AgentDetails, CreatedAgent } from '@/types/agent/agent';
import { AgentFilterRequest } from '@/types/agent/agent-filter';
import { AgentMetadata } from '@/types/agent/agent-metadata';
import { CreateAgentDto } from '@/types/agent/create-agent.dto';
import { GeneralApiResponse, createErrorResponse } from '../../types/api-response';
import { parseBudget } from '../utils/agents';
import { fetchWithAuth } from './index';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const ENDPOINTS = {
  CREATE_AGENT: `${API_BASE}/agents/create-agent`,
  SEARCH_AGENTS: `${API_BASE}/agents/search`,
  AGENT_BY_ID: (id: string) => `${API_BASE}/agents/${id}`,
  AGENT_METADATA: (id: string) => `${API_BASE}/agents/${id}/metadata`,
  FEATURED_AGENTS: `${API_BASE}/agents/featured-agents`,
  MY_AGENTS: `${API_BASE}/agents/my-agents`,
};

export async function createAgent(agent: CreateAgentDto) {
  const response = await fetchWithAuth<CreatedAgent>(ENDPOINTS.CREATE_AGENT, {
    method: 'POST',
    body: JSON.stringify(agent),
  });
  return response;
}

export async function searchAgents(
  searchBody?: AgentFilterRequest,
): Promise<GeneralApiResponse<AgentDetails[]>> {
  try {
    const searchParams = { ...searchBody };

    if (searchParams.minBudget) {
      const budget = parseBudget(searchParams.minBudget);
      searchParams.minBudget = budget.min;
      searchParams.maxBudget = budget.max;
    }

    return fetchWithAuth<AgentDetails[]>(ENDPOINTS.SEARCH_AGENTS, {
      method: 'POST',
      body: JSON.stringify(searchParams),
    });
  } catch (error) {
    console.error('Error preparing agent search:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function getAgentById(
  agentAddress: string,
): Promise<GeneralApiResponse<AgentDetails>> {
  return fetchWithAuth<AgentDetails>(ENDPOINTS.AGENT_BY_ID(agentAddress), {
    method: 'GET',
  });
}

export async function getAgentMetadata(
  agentAddress: string,
): Promise<GeneralApiResponse<AgentMetadata>> {
  return fetchWithAuth<AgentMetadata>(ENDPOINTS.AGENT_METADATA(agentAddress), { method: 'GET' });
}

export async function getFeaturedAgents(): Promise<GeneralApiResponse<AgentDetails[]>> {
  return fetchWithAuth<AgentDetails[]>(ENDPOINTS.FEATURED_AGENTS, { method: 'GET' });
}

export async function getMyAgents(): Promise<GeneralApiResponse<AgentDetails[]>> {
  return fetchWithAuth<AgentDetails[]>(ENDPOINTS.MY_AGENTS, { method: 'GET' });
}
