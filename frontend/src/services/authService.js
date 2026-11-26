import api, { setCsrfToken } from './api';

export const authService = {
  async register(payload) {
    const response = await api.post('/auth/register', payload);
    const { user, csrfToken } = response.data.data;
    if (csrfToken) setCsrfToken(csrfToken);
    return user;
  },

  async login(payload) {
    const response = await api.post('/auth/login', payload);
    const { user, csrfToken } = response.data.data;
    if (csrfToken) setCsrfToken(csrfToken);
    return user;
  },

  async logout() {
    await api.post('/auth/logout');
    setCsrfToken(null);
  },

  async getMe() {
    const response = await api.get('/auth/me');
    const { user, csrfToken } = response.data.data;
    if (csrfToken) setCsrfToken(csrfToken);
    return user;
  },
};
