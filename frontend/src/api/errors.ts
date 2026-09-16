import axios from 'axios';

import type { ProblemDetails } from './types';

/** Normalised API failure. `code` is the backend's stable error code (ProblemDetails.title). */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;
  readonly traceId?: string;
  readonly isNetworkError: boolean;

  constructor(init: {
    code: string;
    message: string;
    status: number;
    fieldErrors?: Record<string, string[]>;
    traceId?: string;
    isNetworkError?: boolean;
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.code = init.code;
    this.status = init.status;
    this.fieldErrors = init.fieldErrors ?? {};
    this.traceId = init.traceId;
    this.isNetworkError = init.isNetworkError ?? false;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

export const NETWORK_ERROR_CODE = 'network.unreachable';

/** Converts anything thrown by axios (or elsewhere) into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError({
        code: NETWORK_ERROR_CODE,
        message: 'Could not reach the server. Check your connection and try again.',
        status: 0,
        isNetworkError: true,
      });
    }

    const problem = (error.response.data ?? {}) as ProblemDetails;
    const status = error.response.status;
    const fieldErrors = problem.errors ?? {};
    const firstFieldError = Object.values(fieldErrors)[0]?.[0];

    return new ApiError({
      code: problem.title ?? `http.${status}`,
      message: problem.detail ?? firstFieldError ?? defaultMessageFor(status),
      status,
      fieldErrors,
      traceId: problem.traceId,
    });
  }

  const message = error instanceof Error ? error.message : String(error);
  return new ApiError({ code: 'unknown', message, status: 0 });
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'Some of the information provided is invalid.';
    case 401:
      return 'Please sign in again.';
    case 403:
      return 'You are not allowed to do that.';
    case 404:
      return 'Not found.';
    case 409:
      return 'That conflicts with the current state. Please retry.';
    case 429:
      return 'Too many attempts. Please wait a moment.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
