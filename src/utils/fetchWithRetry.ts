/**
 * Options for exponential backoff retry execution.
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryOnStatuses?: number[];
  onRetry?: (attempt: number, delayMs: number, errorOrStatus: any) => void;
}

const DEFAULT_RETRY_STATUSES = [429, 500, 502, 503, 504];

/**
 * Calculates exponential backoff delay with random jitter.
 * Respects Retry-After HTTP headers if provided.
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelayMs: number = 400,
  maxDelayMs: number = 5000,
  backoffFactor: number = 2,
  retryAfterHeader?: string | null
): number {
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, maxDelayMs);
    }
  }

  // Exponential backoff with jitter
  const calculated = initialDelayMs * Math.pow(backoffFactor, attempt);
  const jitter = Math.random() * (initialDelayMs * 0.5);
  return Math.min(calculated + jitter, maxDelayMs);
}

/**
 * Executes a fetch request with automatic exponential backoff retry on
 * rate limits (HTTP 429) and transient server errors (5xx).
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelayMs = 400,
    maxDelayMs = 5000,
    backoffFactor = 2,
    retryOnStatuses = DEFAULT_RETRY_STATUSES,
    onRetry,
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(input, init);

      if (!response.ok && retryOnStatuses.includes(response.status) && attempt < maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = calculateBackoffDelay(attempt, initialDelayMs, maxDelayMs, backoffFactor, retryAfter);

        if (onRetry) {
          onRetry(attempt + 1, delay, response.status);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt, initialDelayMs, maxDelayMs, backoffFactor, null);

        if (onRetry) {
          onRetry(attempt + 1, delay, err);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new Error('fetchWithRetry: Max retries exceeded');
}
