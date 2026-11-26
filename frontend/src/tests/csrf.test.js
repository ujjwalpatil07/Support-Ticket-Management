import { beforeEach, describe, expect, it, vi } from 'vitest';
import api, { getCsrfToken, setCsrfToken } from '../services/api';

describe('Frontend Axios CSRF Interceptor Flow', () => {
  beforeEach(() => {
    setCsrfToken(null);
  });

  it('fetches CSRF token before mutating requests when token is missing in memory', async () => {
    const mockAdapter = vi.fn(async (config) => {
      if (config.url === '/auth/csrf-token') {
        return {
          status: 200,
          data: { success: true, data: { csrfToken: 'fresh-token-123' } },
          headers: {},
          config,
        };
      }
      return {
        status: 201,
        data: { success: true, data: { ticket: { _id: 't1' } } },
        headers: {},
        config,
      };
    });

    api.defaults.adapter = mockAdapter;

    const response = await api.post('/tickets', { title: 'Test' });

    expect(response.status).toBe(201);
    expect(mockAdapter).toHaveBeenCalledTimes(2);
    expect(mockAdapter.mock.calls[0][0].url).toBe('/auth/csrf-token');
    expect(mockAdapter.mock.calls[1][0].headers['X-CSRF-Token']).toBe('fresh-token-123');
    expect(getCsrfToken()).toBe('fresh-token-123');
  });

  it('does not attach X-CSRF-Token on GET or pre-auth login/register requests', async () => {
    setCsrfToken('existing-token');
    const mockAdapter = vi.fn(async (config) => ({
      status: 200,
      data: { success: true, data: {} },
      headers: {},
      config,
    }));
    api.defaults.adapter = mockAdapter;

    await api.get('/tickets');
    await api.post('/auth/login', { email: 'a@b.com', password: 'Password123' });

    expect(mockAdapter.mock.calls[0][0].headers['X-CSRF-Token']).toBeUndefined();
    expect(mockAdapter.mock.calls[1][0].headers['X-CSRF-Token']).toBeUndefined();
  });

  it('recovers from a 403 CSRF error by refreshing token and retrying once', async () => {
    setCsrfToken('stale-token');
    let patchAttempts = 0;

    const mockAdapter = vi.fn(async (config) => {
      if (config.url === '/tickets/t1' && config.method === 'patch') {
        patchAttempts += 1;
        if (patchAttempts === 1) {
          const error = new Error('CSRF mismatch');
          error.config = config;
          error.response = {
            status: 403,
            data: { success: false, message: 'Invalid or missing CSRF token' },
          };
          throw error;
        }
        return {
          status: 200,
          data: { success: true, data: { ticket: { _id: 't1' } } },
          headers: {},
          config,
        };
      }

      if (config.url === '/auth/csrf-token') {
        return {
          status: 200,
          data: { success: true, data: { csrfToken: 'recovered-token-456' } },
          headers: {},
          config,
        };
      }

      return { status: 200, data: {}, headers: {}, config };
    });

    api.defaults.adapter = mockAdapter;

    const res = await api.patch('/tickets/t1', { title: 'Updated' });

    expect(res.status).toBe(200);
    expect(patchAttempts).toBe(2);
    expect(mockAdapter.mock.calls[2][0].headers['X-CSRF-Token']).toBe('recovered-token-456');
    expect(getCsrfToken()).toBe('recovered-token-456');
  });
});
