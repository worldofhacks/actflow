import { ArgumentsHost, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  // Define error mappings as static constants
  private static readonly ERROR_MESSAGES: Record<string, { message: string; code: string }> = {
    'Already registered': {
      message: 'This agent is already registered in the system',
      code: 'AGENT_ALREADY_REGISTERED',
    },
    InvalidState: {
      message: 'Operation cannot be performed in the current state',
      code: 'INVALID_STATE',
    },
    Unauthorized: {
      message: 'You do not have permission to perform this action',
      code: 'UNAUTHORIZED',
    },
    InsufficientBalance: {
      message: 'Insufficient balance to complete this transaction',
      code: 'INSUFFICIENT_BALANCE',
    },
    TaskNotFound: {
      message: 'The specified task does not exist',
      code: 'TASK_NOT_FOUND',
    },
    AgentNotFound: {
      message: 'The specified agent does not exist',
      code: 'AGENT_NOT_FOUND',
    },
    TaskAlreadyCompleted: {
      message: 'This task has already been completed',
      code: 'TASK_ALREADY_COMPLETED',
    },
    TaskAlreadyAssigned: {
      message: 'This task has already been assigned to an agent',
      code: 'TASK_ALREADY_ASSIGNED',
    },
    InvalidSignature: {
      message: 'The provided signature is invalid or has expired',
      code: 'INVALID_SIGNATURE',
    },
    'Reward Not Match': {
      message: 'The provided reward does not match the required amount',
      code: 'REWARD_MISMATCH',
    },
    'Self assign not allowed': {
      message: 'Self assign not allowed',
      code: 'SELF_ASSIGN_NOT_ALLOWED',
    },
    INSUFFICIENT_FUNDS: {
      message: 'Insufficient balance to complete this transaction',
      code: 'INSUFFICIENT_BALANCE',
    },
    'No autoAssign': {
      message: 'Agent not supported auto assign task',
      code: 'NO_AUTO_ASSIGN',
    },
    'Deadline is reached': {
      message: 'Deadline is reached',
      code: 'DEADLINE_REACHED',
    },
  };

  private static readonly GENERIC_ERRORS: Record<string, { message: string; code: string }> = {
    'execution reverted': {
      message: 'Transaction reverted by the blockchain contract',
      code: 'CONTRACT_REVERTED',
    },
    network: {
      message: 'Blockchain connection error, please try again later',
      code: 'BLOCKCHAIN_NETWORK_ERROR',
    },
    timeout: {
      message: 'Blockchain connection error, please try again later',
      code: 'BLOCKCHAIN_TIMEOUT',
    },
  };

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorMessage: string;
    let errorCode: string | undefined;

    if (this.isContractError(exception)) {
      const contractError = this.parseContractError(exception);
      if (contractError) {
        errorMessage = contractError.message;
        errorCode = contractError.code;
      } else {
        errorMessage = 'Blockchain operation failed';
        errorCode = 'BLOCKCHAIN_ERROR';
      }
    } else if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      errorMessage =
        typeof responseBody === 'object' && responseBody['message']
          ? Array.isArray(responseBody['message'])
            ? responseBody['message'][0]
            : responseBody['message']
          : exception.message;
      errorCode = `HTTP_${status}`;
    } else {
      errorMessage = exception.message || 'Internal server error';
      errorCode = 'INTERNAL_SERVER_ERROR';
      this.logger.error(`Unhandled exception: ${errorMessage}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      data: null,
      error: errorMessage,
      errorCode,
      statusCode: status,
    });
  }

  private isContractError(error: any): boolean {
    // ethers v5 contract errors often have these properties
    return (
      error &&
      (error.code === 'CALL_EXCEPTION' ||
        error.code === 'INSUFFICIENT_FUNDS' || // Common contract error code
        error.message?.includes('execution reverted') || // Revert errors
        error.reason !== undefined || // Has reason property
        (error.error && error.error.message?.includes('execution reverted'))) // Nested error
    );
  }

  private parseContractError(error: any): { message: string; code: string } | null {
    const errorMsg =
      error.reason || error.code || error.message || (error.error && error.error.message) || '';

    // Check for specific error messages
    const specificError = Object.entries(GlobalExceptionFilter.ERROR_MESSAGES).find(([key]) =>
      errorMsg.toLowerCase().includes(key.toLowerCase()),
    );
    if (specificError) {
      return specificError[1];
    }

    // Check for revert reason
    const revertMatch = errorMsg.match(/reverted:?\s*(?:with reason string\s*)?['"](.+)['"]/);
    if (revertMatch) {
      const reason = revertMatch[1];
      return (
        GlobalExceptionFilter.ERROR_MESSAGES[reason] || {
          message: this.humanizeErrorMessage(reason),
          code: reason.toUpperCase().replace(/\s+/g, '_'),
        }
      );
    }

    // Check for custom errors
    const customMatch = errorMsg.match(/reverted with custom error '(\w+)(?:\(.*\))?'/);
    if (customMatch) {
      const errorName = customMatch[1];
      return (
        GlobalExceptionFilter.ERROR_MESSAGES[errorName] || {
          message: this.humanizeErrorMessage(errorName),
          code: errorName.toUpperCase(),
        }
      );
    }

    // Check for generic errors
    const genericError = Object.entries(GlobalExceptionFilter.GENERIC_ERRORS).find(([key]) =>
      errorMsg.toLowerCase().includes(key),
    );
    if (genericError) {
      return genericError[1];
    }

    return {
      message: `Original contract error: ${errorMsg}`,
      code: 'BLOCKCHAIN_ERROR_DETAIL',
    };
  }

  private humanizeErrorMessage(errorString: string): string {
    return (
      GlobalExceptionFilter.ERROR_MESSAGES[errorString]?.message ||
      errorString
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase())
    );
  }
}
