import { fetchWithAuth, fetchWithOutAuth } from '.';
import { GeneralApiResponse } from '../../types/api-response';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const ENDPOINTS = {
  TOPICS: `${API_BASE}/static/topics`,
  SKILLS: `${API_BASE}/static/skills`,
};

type TopicResponse = string[];
type SkillResponse = string[];

export async function getTopics(): Promise<GeneralApiResponse<TopicResponse>> {
  return fetchWithAuth<TopicResponse>(ENDPOINTS.TOPICS, { method: 'GET' });
}

export async function getSkills(topic: string): Promise<GeneralApiResponse<SkillResponse>> {
  return fetchWithOutAuth<SkillResponse>(ENDPOINTS.SKILLS + `?topic=${topic}`, { method: 'GET' });
}
