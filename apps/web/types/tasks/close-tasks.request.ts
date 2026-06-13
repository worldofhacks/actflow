// types/tasks/close-tasks.request.ts
export interface CloseTasksRequest {
  fromWallet: string;
  taskIds: string[];
  withdraw: boolean;
}
