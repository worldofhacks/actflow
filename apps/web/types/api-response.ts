export interface GeneralApiResponse<T> {
  success: boolean;
  message: string;
  error?: string;
  data?: T;
  statusCode?: number;
  errorCode?: string;
}

export function isSuccessResponse<T>(
  response: GeneralApiResponse<T>,
): response is GeneralApiResponse<T> & { data: T } {
  return response.success === true && response.data !== undefined;
}

export function isErrorResponse<T>(
  response: GeneralApiResponse<T>,
): response is GeneralApiResponse<T> & { error: string } {
  return response.success === false && response.error !== undefined;
}

export function createErrorResponse<T = unknown>(
  error: string | Error,
  statusCode = 500,
  errorCode?: string,
): GeneralApiResponse<T> {
  return {
    success: false,
    error: error instanceof Error ? error.message : error,
    statusCode,
    errorCode,
    message: 'An error occurred',
  };
}
export function createSuccessResponse<T = unknown>(
  data: T,
  message = 'Success',
  statusCode = 200,
): GeneralApiResponse<T> {
  return {
    success: true,
    data,
    message,
    statusCode,
  };
}

export async function handleApiResponse<T, R>(
  promise: Promise<GeneralApiResponse<T>>,
  onSuccess: (data: T) => R,
  onError?: (error: string) => R,
): Promise<R> {
  try {
    const response = await promise;
    if (isSuccessResponse(response)) {
      return onSuccess(response.data);
    } else if (onError) {
      return onError(response.error || 'Unknown error');
    } else {
      throw new Error(response.error || 'Unknown error');
    }
  } catch (error) {
    if (onError) {
      return onError(error instanceof Error ? error.message : 'Unknown error');
    }
    throw error;
  }
}
