export interface CreateTaskResponse {
  mongoId: any;
  taskId: string;
  transactionHash: string;
}

export interface SubmitTaskResultResponse {
  transactionHash: string;
}
