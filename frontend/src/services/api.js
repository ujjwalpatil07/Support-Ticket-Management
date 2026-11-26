import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1');

let csrfTokenInMemory = null;
let inFlightCsrfPromise = null;

export function setCsrfToken(token) {
  csrfTokenInMemory = token || null;
}

export function getCsrfToken() {
  return csrfTokenInMemory;
}

function setHeader(config, name, value) {
  if (!config.headers) {
    config.headers = {};
  }
  if (typeof config.headers.set === 'function') {
    config.headers.set(name, value);
  } else {
    config.headers[name] = value;
  }
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const PUBLIC_AUTH_URLS = ['/auth/login', '/auth/register'];

export async function ensureCsrfToken() {
  if (csrfTokenInMemory) {
    return csrfTokenInMemory;
  }

  if (!inFlightCsrfPromise) {
    inFlightCsrfPromise = api
      .get('/auth/csrf-token')
      .then((response) => {
        const token = response.data?.data?.csrfToken || null;
        setCsrfToken(token);
        return token;
      })
      .finally(() => {
        inFlightCsrfPromise = null;
      });
  }

  return inFlightCsrfPromise;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  const isPublicAuth = PUBLIC_AUTH_URLS.some((path) => url.endsWith(path));

  if (MUTATING_METHODS.has(method) && !isPublicAuth) {
    if (!csrfTokenInMemory && !url.includes('/auth/csrf-token')) {
      try {
        await ensureCsrfToken();
      } catch {
        // Let the request proceed so backend returns a standard error if unreachable
      }
    }
    if (csrfTokenInMemory) {
      setHeader(config, 'X-CSRF-Token', csrfTokenInMemory);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isCsrfError =
      error.response?.status === 403 &&
      /csrf/i.test(error.response?.data?.message || '');

    if (isCsrfError && originalRequest && !originalRequest._csrfRetried) {
      originalRequest._csrfRetried = true;
      setCsrfToken(null);
      try {
        const freshToken = await ensureCsrfToken();
        if (freshToken) {
          setHeader(originalRequest, 'X-CSRF-Token', freshToken);
          return api(originalRequest);
        }
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
