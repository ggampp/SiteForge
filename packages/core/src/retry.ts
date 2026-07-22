export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Retry only on these error message patterns (default: network-ish) */
  retryOn?: RegExp;
}

const DEFAULT_RETRY_ON =
  /timeout|aborted|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|socket|network|HTTP 5\d\d|fetch failed/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run an async fn with exponential backoff retries.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = options.baseDelayMs ?? 250;
  const maxDelayMs = options.maxDelayMs ?? 4_000;
  const retryOn = options.retryOn ?? DEFAULT_RETRY_ON;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      const shouldRetry = attempt < attempts && retryOn.test(message);
      if (!shouldRetry) throw err;
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      await sleep(delay);
    }
  }
  throw lastErr;
}
