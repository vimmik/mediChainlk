import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Returns true for errors that should NOT be retried:
 *  - 400 Bad Request  — the request itself is malformed
 *  - 401 Unauthorized — handled by the axios interceptor (redirect to login)
 *  - 403 Forbidden    — user lacks permission; retrying won't help
 *  - 404 Not Found    — resource doesn't exist; retrying won't help
 *  - 409 Conflict     — duplicate; retrying won't help
 *  - 422 Unprocessable — validation failed; retrying won't help
 */
function isNonRetryableError(error: unknown): boolean {
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    return [400, 401, 403, 404, 409, 422].includes(status);
  }
  return false;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 30 seconds — avoids redundant refetches when the user
      // navigates between pages in quick succession.
      staleTime: 30_000,
      // Refetch on window focus only if data is stale (controlled by staleTime).
      refetchOnWindowFocus: true,
      // Don't retry 4xx errors — they indicate a client-side problem.
      // Retry network/5xx errors up to 2 times with exponential backoff.
      retry: (failureCount, error) => {
        if (isNonRetryableError(error)) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
    },
    mutations: {
      // Mutations are one-shot by default — never retry automatically to avoid
      // accidental duplicate writes (e.g. creating a tenant twice).
      retry: false,
    },
  },
});
