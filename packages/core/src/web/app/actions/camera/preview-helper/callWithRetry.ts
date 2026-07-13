interface RetryOptions {
  /** Total number of attempts, including the first one. */
  attempts?: number;
  /** Fixed delay in ms between attempts. */
  delay?: number;
  /** Called before each retry wait, e.g. to log or clean up partial state. */
  onRetry?: (error: unknown, attempt: number) => Promise<void> | void;
}

/**
 * Run a network call with retries for flaky (e.g. unstable network) failures.
 *
 * Retries when `fn` throws error, waiting a fixed delay between attempts.
 * If every attempt fails, the final error is re-thrown so the caller can handle it.
 *
 * @param fn the network call to run; should throw/reject on failure
 * @returns the resolved value of `fn` from the first successful attempt
 */
const callWithRetry = async <T>(
  fn: () => Promise<T> | T,
  { attempts = 3, delay = 1000, onRetry }: RetryOptions = {},
): Promise<T> => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts) {
        throw error;
      }

      console.warn(`Network call failed (attempt ${attempt}/${attempts}), retrying in ${delay}ms...`, error);
      await onRetry?.(error, attempt);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default callWithRetry;
