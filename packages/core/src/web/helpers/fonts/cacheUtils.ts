export const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
export const REQUEST_TIMEOUT = 10000; // 10 seconds
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_BASE = 1000; // 1 second

export function calculateRetryDelay(attempt: number, jitter = 0): number {
  return RETRY_DELAY_BASE * Math.pow(2, attempt - 1) + Math.random() * jitter;
}

export async function fetchWithRetry<T>(fetcher: () => Promise<T>, attempts = MAX_RETRY_ATTEMPTS): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      lastError = error as Error;

      const isLastAttempt = attempt === attempts;

      if (!isLastAttempt) {
        const delay = calculateRetryDelay(attempt);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

export function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
  });
}
