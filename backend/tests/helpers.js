import request from 'supertest';
import { User } from '../src/models/User.js';
import { ROLES } from '../src/utils/constants.js';

export async function createAuthenticatedAgent(app, userData = {}) {
  const agent = request.agent(app);
  const payload = {
    name: userData.name || 'Test User',
    email: userData.email || `user-${Date.now()}-${Math.random()}@example.com`,
    password: userData.password || 'Password123!',
  };

  const res = await agent.post('/api/v1/auth/register').send(payload);
  return {
    agent,
    user: res.body.data.user,
    csrfToken: res.body.data.csrfToken,
    response: res,
  };
}

export async function createAdminAgent(app, adminData = {}) {
  const email = adminData.email || `admin-${Date.now()}-${Math.random()}@example.com`;
  const password = adminData.password || 'AdminPass123!';

  await User.create({
    name: adminData.name || 'Test Admin',
    email,
    password,
    role: ROLES.ADMIN,
    isActive: true,
  });

  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').send({ email, password });

  return {
    agent,
    user: res.body.data.user,
    csrfToken: res.body.data.csrfToken,
    response: res,
  };
}
