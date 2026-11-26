import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { createAdminAgent, createAuthenticatedAgent } from './helpers.js';

const app = createApp();

describe('Authentication & Authorization API', () => {
  test('GET /api/v1/health returns ok status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  test('registers a new user with role always forced to user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Alice Johnson',
      email: 'ALICE@Example.com',
      password: 'Password123',
      role: 'admin',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.user.role).toBe('user');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.csrfToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('rejects duplicate email registration', async () => {
    await createAuthenticatedAgent(app, { email: 'dup@example.com' });

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Second User',
      email: 'dup@example.com',
      password: 'Password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('logs in with valid credentials and rejects invalid password', async () => {
    await createAuthenticatedAgent(app, {
      email: 'login@example.com',
      password: 'Password123',
    });

    const badRes = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPassword123',
    });
    expect(badRes.status).toBe(401);

    const okRes = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'Password123',
    });
    expect(okRes.status).toBe(200);
    expect(okRes.body.data.user.email).toBe('login@example.com');
    expect(okRes.headers['set-cookie']).toBeDefined();
  });

  test('blocks inactive users from logging in or accessing protected routes', async () => {
    const { agent, user } = await createAuthenticatedAgent(app, {
      email: 'inactive@example.com',
      password: 'Password123',
    });

    await User.findByIdAndUpdate(user._id, { isActive: false });

    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(403);

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'inactive@example.com',
      password: 'Password123',
    });
    expect(loginRes.status).toBe(403);
  });

  test('protects /auth/me and clears session on logout', async () => {
    const unauthRes = await request(app).get('/api/v1/auth/me');
    expect(unauthRes.status).toBe(401);

    const { agent, csrfToken } = await createAuthenticatedAgent(app, {
      email: 'session@example.com',
    });

    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('session@example.com');

    const logoutRes = await agent
      .post('/api/v1/auth/logout')
      .set('X-CSRF-Token', csrfToken);
    expect(logoutRes.status).toBe(200);

    const afterLogout = await agent.get('/api/v1/auth/me');
    expect(afterLogout.status).toBe(401);
  });

  test('enforces CSRF token across POST, PATCH, DELETE, logout, and supports CSRF token recovery', async () => {
    const { agent, csrfToken } = await createAuthenticatedAgent(app, {
      email: 'csrf@example.com',
      password: 'Password123',
    });

    // Missing CSRF header -> 403
    const missingRes = await agent.post('/api/v1/tickets').send({
      title: 'Missing CSRF',
      description: 'Should fail without CSRF header',
      category: 'Technical Issue',
    });
    expect(missingRes.status).toBe(403);
    expect(missingRes.body.message).toMatch(/CSRF/i);

    // Mismatched CSRF header -> 403
    const mismatchRes = await agent
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', 'wrong-csrf-token-value')
      .send({
        title: 'Mismatched CSRF',
        description: 'Should fail with wrong CSRF header',
        category: 'Technical Issue',
      });
    expect(mismatchRes.status).toBe(403);

    // Valid CSRF header -> POST, PATCH, DELETE succeed
    const createRes = await agent
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', csrfToken)
      .send({
        title: 'Valid CSRF Ticket',
        description: 'Created with valid CSRF header',
        category: 'Technical Issue',
      });
    expect(createRes.status).toBe(201);
    const ticketId = createRes.body.data.ticket._id;

    // GET succeeds without X-CSRF-Token
    const getRes = await agent.get(`/api/v1/tickets/${ticketId}`);
    expect(getRes.status).toBe(200);

    // PATCH without CSRF fails -> 403, with CSRF succeeds -> 200
    const patchFail = await agent
      .patch(`/api/v1/tickets/${ticketId}`)
      .send({ title: 'No CSRF Patch' });
    expect(patchFail.status).toBe(403);

    const patchOk = await agent
      .patch(`/api/v1/tickets/${ticketId}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ title: 'Valid CSRF Patch' });
    expect(patchOk.status).toBe(200);

    // Recovery via GET /auth/csrf-token
    const refreshRes = await agent.get('/api/v1/auth/csrf-token');
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.csrfToken).toBe(csrfToken);

    // DELETE without CSRF fails -> 403, with CSRF succeeds -> 200
    const deleteFail = await agent.delete(`/api/v1/tickets/${ticketId}`);
    expect(deleteFail.status).toBe(403);

    const deleteOk = await agent
      .delete(`/api/v1/tickets/${ticketId}`)
      .set('X-CSRF-Token', csrfToken);
    expect(deleteOk.status).toBe(200);

    // Logout without CSRF fails -> 403
    const logoutWithoutCsrf = await agent.post('/api/v1/auth/logout');
    expect(logoutWithoutCsrf.status).toBe(403);
    expect(logoutWithoutCsrf.body.message).toMatch(/CSRF/i);

    // Logout with CSRF succeeds and clears cookies; subsequent login rotates CSRF token
    const logoutOk = await agent
      .post('/api/v1/auth/logout')
      .set('X-CSRF-Token', csrfToken);
    expect(logoutOk.status).toBe(200);

    const reloginRes = await agent.post('/api/v1/auth/login').send({
      email: 'csrf@example.com',
      password: 'Password123',
    });
    expect(reloginRes.status).toBe(200);
    expect(reloginRes.body.data.csrfToken).toBeDefined();
    expect(reloginRes.body.data.csrfToken).not.toBe(csrfToken);
  });

  test('rejects unauthenticated access to protected routes', async () => {
    const [ticketsRes, notifRes, statsRes] = await Promise.all([
      request(app).get('/api/v1/tickets'),
      request(app).get('/api/v1/notifications'),
      request(app).get('/api/v1/dashboard/stats'),
    ]);

    expect(ticketsRes.status).toBe(401);
    expect(notifRes.status).toBe(401);
    expect(statsRes.status).toBe(401);
  });

  test('enforces role-based authorization on admin routes', async () => {
    const { agent: userAgent, csrfToken: userCsrf } = await createAuthenticatedAgent(app, {
      email: 'normal@example.com',
    });
    const { agent: adminAgent, csrfToken: adminCsrf } = await createAdminAgent(app, {
      email: 'admin@example.com',
    });

    const ticketRes = await userAgent
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', userCsrf)
      .send({
        title: 'Role test ticket',
        description: 'Testing admin route restrictions',
        category: 'Account Issue',
      });

    const ticketId = ticketRes.body.data.ticket._id;

    const userStatusAttempt = await userAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', userCsrf)
      .send({ status: 'In Progress' });
    expect(userStatusAttempt.status).toBe(403);

    const adminStatusAttempt = await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'In Progress' });
    expect(adminStatusAttempt.status).toBe(200);
    expect(adminStatusAttempt.body.data.ticket.status).toBe('In Progress');
  });
});
