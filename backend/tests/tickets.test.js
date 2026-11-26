import { createApp } from '../src/app.js';
import { createAdminAgent, createAuthenticatedAgent } from './helpers.js';

const app = createApp();

describe('Ticket Management & Lifecycle API', () => {
  test('user creates ticket, lists only own tickets, and cannot access another user ticket', async () => {
    const { agent: userA, csrfToken: csrfA } = await createAuthenticatedAgent(app, {
      name: 'User A',
      email: 'usera@example.com',
    });
    const { agent: userB, csrfToken: csrfB } = await createAuthenticatedAgent(app, {
      name: 'User B',
      email: 'userb@example.com',
    });

    const createRes = await userA
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', csrfA)
      .send({
        title: 'Cannot reset password',
        description: 'Password reset link returns 400 error.',
        category: 'Account Issue',
      });

    expect(createRes.status).toBe(201);
    const ticketA = createRes.body.data.ticket;
    expect(ticketA.status).toBe('Open');
    expect(ticketA.priority).toBe('Medium');

    await userB
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', csrfB)
      .send({
        title: 'Billing invoice missing',
        description: 'Cannot download last month invoice PDF.',
        category: 'Payment Issue',
        priority: 'High',
      });

    const listARes = await userA.get('/api/v1/tickets');
    expect(listARes.status).toBe(200);
    expect(listARes.body.data.tickets).toHaveLength(1);
    expect(listARes.body.data.tickets[0].title).toBe('Cannot reset password');

    const forbiddenGet = await userB.get(`/api/v1/tickets/${ticketA._id}`);
    expect(forbiddenGet.status).toBe(403);
  });

  test('user can edit and soft-delete only while status is Open', async () => {
    const { agent: userAgent, csrfToken: userCsrf } = await createAuthenticatedAgent(app, {
      email: 'owner@example.com',
    });
    const { agent: adminAgent, csrfToken: adminCsrf } = await createAdminAgent(app, {
      email: 'admin-lifecycle@example.com',
    });

    const createRes = await userAgent
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', userCsrf)
      .send({
        title: 'Initial title',
        description: 'Initial detailed description',
        category: 'Technical Issue',
      });
    const ticketId = createRes.body.data.ticket._id;

    // User cannot change status/priority via PATCH /tickets/:id
    const protectedFieldAttempt = await userAgent
      .patch(`/api/v1/tickets/${ticketId}`)
      .set('X-CSRF-Token', userCsrf)
      .send({ status: 'Closed' });
    expect(protectedFieldAttempt.status).toBe(400);

    // User can edit while Open
    const editRes = await userAgent
      .patch(`/api/v1/tickets/${ticketId}`)
      .set('X-CSRF-Token', userCsrf)
      .send({ title: 'Updated Open Title' });
    expect(editRes.status).toBe(200);
    expect(editRes.body.data.ticket.title).toBe('Updated Open Title');

    // Move to In Progress
    await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'In Progress' });

    // User cannot edit or delete once In Progress
    const editBlocked = await userAgent
      .patch(`/api/v1/tickets/${ticketId}`)
      .set('X-CSRF-Token', userCsrf)
      .send({ title: 'Blocked Update' });
    expect(editBlocked.status).toBe(400);

    const deleteBlocked = await userAgent
      .delete(`/api/v1/tickets/${ticketId}`)
      .set('X-CSRF-Token', userCsrf);
    expect(deleteBlocked.status).toBe(400);

    // Create another Open ticket and soft-delete it
    const deletableRes = await userAgent
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', userCsrf)
      .send({
        title: 'Delete me',
        description: 'Accidental duplicate ticket',
        category: 'Other',
      });
    const deletableId = deletableRes.body.data.ticket._id;

    const deleteOk = await userAgent
      .delete(`/api/v1/tickets/${deletableId}`)
      .set('X-CSRF-Token', userCsrf);
    expect(deleteOk.status).toBe(200);

    // Soft-deleted ticket is excluded from listings and single fetches
    const fetchDeleted = await userAgent.get(`/api/v1/tickets/${deletableId}`);
    expect(fetchDeleted.status).toBe(404);

    const adminList = await adminAgent.get('/api/v1/tickets');
    expect(adminList.body.data.tickets.some((t) => t._id === deletableId)).toBe(false);
  });

  test('enforces valid status transitions, resolution timestamps, and reopening', async () => {
    const { agent: userAgent, csrfToken: userCsrf } = await createAuthenticatedAgent(app, {
      email: 'flowuser@example.com',
    });
    const { agent: adminAgent, csrfToken: adminCsrf } = await createAdminAgent(app, {
      email: 'flowadmin@example.com',
    });

    const createRes = await userAgent
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', userCsrf)
      .send({
        title: 'API timeout on checkout',
        description: 'Requests hang for 30s on checkout endpoint',
        category: 'Technical Issue',
      });
    const ticketId = createRes.body.data.ticket._id;

    // Invalid direct Open -> Resolved
    const invalidRes = await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'Resolved' });
    expect(invalidRes.status).toBe(400);

    // Open -> In Progress
    await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'In Progress' });

    // In Progress -> Resolved
    const resolvedRes = await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'Resolved' });
    expect(resolvedRes.status).toBe(200);
    expect(resolvedRes.body.data.ticket.resolvedAt).toBeTruthy();

    // Resolved -> Closed
    const closedRes = await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'Closed' });
    expect(closedRes.status).toBe(200);
    expect(closedRes.body.data.ticket.closedAt).toBeTruthy();

    // Closed -> Open (Reopen clears resolvedAt and closedAt)
    const reopenedRes = await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'Open' });
    expect(reopenedRes.status).toBe(200);
    expect(reopenedRes.body.data.ticket.resolvedAt).toBeNull();
    expect(reopenedRes.body.data.ticket.closedAt).toBeNull();

    // Open -> In Progress -> Resolved -> In Progress (Reopen from Resolved)
    await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'In Progress' });
    await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'Resolved' });

    const reopenFromResolved = await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'In Progress' });
    expect(reopenFromResolved.status).toBe(200);
    expect(reopenFromResolved.body.data.ticket.resolvedAt).toBeNull();

    // Same-status update and invalid In Progress -> Closed rejected
    const sameStatus = await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'In Progress' });
    expect(sameStatus.status).toBe(400);

    const invalidClosed = await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'Closed' });
    expect(invalidClosed.status).toBe(400);
  });

  test('admin can edit and soft-delete tickets and soft-deleted tickets are excluded everywhere', async () => {
    const { agent: userAgent, csrfToken: userCsrf } = await createAuthenticatedAgent(app, {
      email: 'admindeleteuser@example.com',
    });
    const { agent: adminAgent, csrfToken: adminCsrf } = await createAdminAgent(app, {
      email: 'admindelete@example.com',
    });

    const createRes = await userAgent
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', userCsrf)
      .send({
        title: 'Admin managed ticket',
        description: 'Details before admin edit',
        category: 'Other',
      });
    const ticketId = createRes.body.data.ticket._id;

    await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'In Progress' });

    const adminEdit = await adminAgent
      .patch(`/api/v1/tickets/${ticketId}`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ title: 'Admin updated title' });
    expect(adminEdit.status).toBe(200);
    expect(adminEdit.body.data.ticket.title).toBe('Admin updated title');

    const adminDelete = await adminAgent
      .delete(`/api/v1/tickets/${ticketId}`)
      .set('X-CSRF-Token', adminCsrf);
    expect(adminDelete.status).toBe(200);

    const [getAfter, commentsAfter, activityAfter, statsAfter] = await Promise.all([
      adminAgent.get(`/api/v1/tickets/${ticketId}`),
      adminAgent.get(`/api/v1/tickets/${ticketId}/comments`),
      adminAgent.get(`/api/v1/tickets/${ticketId}/activities`),
      adminAgent.get('/api/v1/dashboard/stats'),
    ]);

    expect(getAfter.status).toBe(404);
    expect(commentsAfter.status).toBe(404);
    expect(activityAfter.status).toBe(404);
    expect(statsAfter.body.data.totalTickets).toBe(0);
  });

  test('supports search, filters, and pagination for admin', async () => {
    const { agent: userAgent, csrfToken: userCsrf } = await createAuthenticatedAgent(app, {
      email: 'filteruser@example.com',
    });
    const { agent: adminAgent, csrfToken: adminCsrf } = await createAdminAgent(app, {
      email: 'filteradmin@example.com',
    });

    await userAgent
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', userCsrf)
      .send({
        title: 'Database connection spike',
        description: 'High latency observed in EU cluster',
        category: 'Technical Issue',
        priority: 'Critical',
      });

    await userAgent
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', userCsrf)
      .send({
        title: 'Question about annual plan',
        description: 'Need pricing details for 20 seats',
        category: 'General Inquiry',
        priority: 'Low',
      });

    const res = await adminAgent.get(
      '/api/v1/tickets?search=Database&priority=Critical&page=1&limit=5'
    );
    expect(res.status).toBe(200);
    expect(res.body.data.tickets).toHaveLength(1);
    expect(res.body.data.tickets[0].title).toBe('Database connection spike');
    expect(res.body.data.pagination.total).toBe(1);

    const prioUpdate = await adminAgent
      .patch(`/api/v1/admin/tickets/${res.body.data.tickets[0]._id}/priority`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ priority: 'High' });
    expect(prioUpdate.status).toBe(200);
    expect(prioUpdate.body.data.ticket.priority).toBe('High');
  });
});
