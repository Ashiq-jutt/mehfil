import { AxiosError, AxiosHeaders } from 'axios';

import { ApiError, NETWORK_ERROR_CODE, toApiError } from '../errors';

function axiosErrorWith(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('request failed', String(status), config, null, {
    status,
    statusText: 'x',
    headers: {},
    config,
    data,
  });
}

describe('toApiError', () => {
  it('maps ProblemDetails title/detail to code/message', () => {
    const error = toApiError(
      axiosErrorWith(401, { title: 'auth.invalid_refresh_token', detail: 'Expired.', status: 401, traceId: 't1' }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('auth.invalid_refresh_token');
    expect(error.message).toBe('Expired.');
    expect(error.status).toBe(401);
    expect(error.traceId).toBe('t1');
    expect(error.isUnauthorized).toBe(true);
  });

  it('surfaces the first field error from a validation problem', () => {
    const error = toApiError(
      axiosErrorWith(400, { title: 'validation.failed', errors: { IdToken: ["'Id Token' must not be empty."] } }),
    );

    expect(error.code).toBe('validation.failed');
    expect(error.message).toBe("'Id Token' must not be empty.");
    expect(error.fieldErrors.IdToken).toHaveLength(1);
  });

  it('treats a missing response as a network error', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK', { headers: new AxiosHeaders() }));

    expect(error.code).toBe(NETWORK_ERROR_CODE);
    expect(error.isNetworkError).toBe(true);
    expect(error.status).toBe(0);
  });

  it('passes ApiError through and wraps unknown errors', () => {
    const original = new ApiError({ code: 'x', message: 'y', status: 418 });
    expect(toApiError(original)).toBe(original);

    const wrapped = toApiError(new Error('boom'));
    expect(wrapped.code).toBe('unknown');
    expect(wrapped.message).toBe('boom');
  });
});
