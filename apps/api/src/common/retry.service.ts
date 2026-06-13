import { Injectable, Logger } from '@nestjs/common';

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000;
  private readonly DEFAULT_BACKOFF_MULTIPLIER = 1.5;

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: RetryConfig = {},
  ): Promise<T> {
    const {
      maxRetries = this.DEFAULT_MAX_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY,
      backoffMultiplier = this.DEFAULT_BACKOFF_MULTIPLIER,
      shouldRetry = (error: any) => {
        if (error.reason === 'Agent already registered') return false;
        //INSUFFICIENT_FUND
        return true;
      },
    } = config;

    let retries = 0;
    let currentDelay = retryDelay;

    while (retries < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        retries++;

        if (!shouldRetry(error) || retries === maxRetries) {
          this.logger.error(`${operationName} failed: ${error.message}`);
          return null;
        }

        this.logger.warn(
          `${operationName}: Retry ${retries}/${maxRetries} after ${currentDelay}ms`,
        );
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }
    throw new Error(`${operationName}: Max retries (${maxRetries}) reached`);
  }
}
