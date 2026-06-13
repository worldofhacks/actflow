'use server';

import { fetchWithAuth } from '.';
import { GeneralApiResponse } from '../../types/api-response';
import { AcceptTaskRequest } from '../../types/tasks/accept-task.request';
import { AcceptTaskResponse } from '../../types/tasks/accept-task.response';
import { AssignTaskRequest } from '../../types/tasks/assign-task.request';
import { AssignTaskResponse } from '../../types/tasks/assign-task.response';
import { CloseTasksResponse } from '../../types/tasks/close-task.response';
import { CloseTasksRequest } from '../../types/tasks/close-tasks.request';
import { CreateTaskRequest } from '../../types/tasks/create-task.request';
import { CreateTaskResponse } from '../../types/tasks/create-task.response';
import { DisputeTaskRequest } from '../../types/tasks/dispute-task.request';
import { SubmitResultDto } from '../../types/tasks/submit-result.request';
import { TaskDetails } from '../../types/tasks/task-details.response';
import { TaskFilterRequest } from '../../types/tasks/task-filter.request';
import { ValidateTaskDto } from '../../types/tasks/validate-task';

// API endpoints
const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const ENDPOINTS = {
  CREATE_TASK: `${API_BASE}/tasks/create-task`,
  SEARCH_TASKS: `${API_BASE}/tasks/search`,
  TASK_BY_ID: (id: string) => `${API_BASE}/tasks/${id}`,
  ASSIGN_TASK: `${API_BASE}/tasks/assign-task`,
  ACCEPT_TASK: `${API_BASE}/tasks/accept-task`,
  CLOSE_TASKS: `${API_BASE}/tasks/close-tasks`,
  DISPUTE_TASK: `${API_BASE}/tasks/dispute-task`,
  SUBMIT_RESULT: `${API_BASE}/tasks/submit-result`,
  VALIDATE_TASK: `${API_BASE}/tasks/validate-task`,
};

/**
 * Creates a new task
 */
export async function createTask(
  task: CreateTaskRequest,
): Promise<GeneralApiResponse<CreateTaskResponse>> {
  return fetchWithAuth<CreateTaskResponse>(ENDPOINTS.CREATE_TASK, {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

/**
 * Gets tasks based on filter criteria
 */
export async function searchTasks(
  filters?: TaskFilterRequest,
): Promise<GeneralApiResponse<TaskDetails[]>> {
  return fetchWithAuth<TaskDetails[]>(ENDPOINTS.SEARCH_TASKS, {
    method: 'POST',
    body: JSON.stringify(filters || {}),
  });
}

/**
 * Gets a task by its ID
 */
export async function getTaskById(id: string): Promise<GeneralApiResponse<TaskDetails>> {
  return fetchWithAuth<TaskDetails>(ENDPOINTS.TASK_BY_ID(id), { method: 'GET' });
}

/**
 * Assigns a task to an agent
 */
export async function assignTaskToAgent(
  request: AssignTaskRequest,
): Promise<GeneralApiResponse<AssignTaskResponse>> {
  return fetchWithAuth<AssignTaskResponse>(ENDPOINTS.ASSIGN_TASK, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function acceptTask(
  request: AcceptTaskRequest,
): Promise<GeneralApiResponse<AcceptTaskResponse>> {
  return fetchWithAuth<AcceptTaskResponse>(ENDPOINTS.ACCEPT_TASK, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
/**
 * Closes multiple tasks
 */
export async function closeTasks(
  request: CloseTasksRequest,
): Promise<GeneralApiResponse<CloseTasksResponse>> {
  return fetchWithAuth<CloseTasksResponse>(ENDPOINTS.CLOSE_TASKS, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Disputes a task
 */
export async function disputeTask(
  request: DisputeTaskRequest,
): Promise<GeneralApiResponse<{ success: boolean; transactionHash: string }>> {
  return fetchWithAuth<{ success: boolean; transactionHash: string }>(ENDPOINTS.DISPUTE_TASK, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export const submitTaskResult = async (data: SubmitResultDto) => {
  try {
    return await fetchWithAuth<SubmitResultDto>(ENDPOINTS.SUBMIT_RESULT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Error submitting task result:', error);
    return { success: false, message: 'Failed to submit task result' };
  }
};

export const validateTask = async (data: ValidateTaskDto) => {
  // TODO: remove hardcode
  return await fetchWithAuth<{
    success: boolean;
    transactionHash: string;
  }>(ENDPOINTS.VALIDATE_TASK, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
