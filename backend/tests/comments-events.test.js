import { jest } from '@jest/globals';
import { createApp } from '../src/app.js';
import { appEvents } from '../src/events/eventEmitter.js';
import { EVENT_TYPES } from '../src/events/eventTypes.js';
import { createAdminAgent, createAuthenticatedAgent } from './helpers.js';

const app = createApp();

describe('Comments, Events, Activities, Notifications & Dashboard API', () => {
  test('ticket creation, comments, status changes, and resolution generate activities and targeted notifications without duplicates', async () => {
    const { agent: adminAgent, csrfToken: adminCsrf } = await createAdminAgent(app, {
      name: 'Support Lead',
      email: 'lead@example.com',
    });
    const { agent: userAgent, csrfToken: userCsrf } = await createAuthenticatedAgent(app, {
      name: 'Jane Customer',
      email: 'jane@example.com',
    });
    const { agent: otherUserAgent, csrfToken: otherCsrf } = await createAuthenticatedAgent(app, {
      name: 'Other User',
      email: 'other@example.com',
    });

    // 1. User creates ticket -> notifies admin
    const ticketRes = await userAgent
      .post('/api/v1/tickets')
      .set('X-CSRF-Token', userCsrf)
      .send({
        title: 'Webhook signature mismatch',
        description: 'HMAC verification failing on staging webhook.',
        category: 'Technical Issue',
        priority: 'High',
      });
    const ticketId = ticketRes.body.data.ticket._id;

    // Admin should have 1 notification
    let adminNotifRes = await adminAgent.get('/api/v1/notifications');
    expect(adminNotifRes.status).toBe(200);
    expect(adminNotifRes.body.data.notifications).toHaveLength(1);
    expect(adminNotifRes.body.data.notifications[0].type).toBe('ticket.created');

    // 2. Other user cannot comment on Jane's ticket
    const blockedComment = await otherUserAgent
      .post(`/api/v1/tickets/${ticketId}/comments`)
      .set('X-CSRF-Token', otherCsrf)
      .send({ message: 'Sneaky comment' });
    expect(blockedComment.status).toBe(403);

    // 3. Jane comments on her ticket -> notifies admin
    const userComment = await userAgent
      .post(`/api/v1/tickets/${ticketId}/comments`)
      .set('X-CSRF-Token', userCsrf)
      .send({ message: 'Added request ID header details.' });
    expect(userComment.status).toBe(201);

    adminNotifRes = await adminAgent.get('/api/v1/notifications/unread-count');
    expect(adminNotifRes.body.data.unreadCount).toBe(2);

    // 4. Admin comments -> notifies Jane
    const adminComment = await adminAgent
      .post(`/api/v1/tickets/${ticketId}/comments`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ message: 'Investigating this now.' });
    expect(adminComment.status).toBe(201);

    const commentsRes = await userAgent.get(`/api/v1/tickets/${ticketId}/comments`);
    expect(commentsRes.status).toBe(200);
    expect(commentsRes.body.data.comments).toHaveLength(2);
    expect(commentsRes.body.data.comments[0].message).toBe('Added request ID header details.');
    expect(commentsRes.body.data.comments[1].message).toBe('Investigating this now.');

    // 5. Admin transitions Open -> In Progress -> Resolved
    await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'In Progress' });

    await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'Resolved' });

    // Jane should have 3 notifications: admin comment, In Progress status change, and ONE Ticket Resolved (no duplicate!)
    const userNotifRes = await userAgent.get('/api/v1/notifications');
    expect(userNotifRes.status).toBe(200);
    expect(userNotifRes.body.data.notifications).toHaveLength(3);
    const resolvedNotifs = userNotifRes.body.data.notifications.filter(
      (n) => n.type === 'ticket.resolved'
    );
    expect(resolvedNotifs).toHaveLength(1);

    // Other user cannot mark Jane's notification as read
    const janeNotifId = userNotifRes.body.data.notifications[0]._id;
    const hijackNotif = await otherUserAgent
      .patch(`/api/v1/notifications/${janeNotifId}/read`)
      .set('X-CSRF-Token', otherCsrf);
    expect(hijackNotif.status).toBe(403);

    // Jane marks one as read, then marks all as read
    const markOne = await userAgent
      .patch(`/api/v1/notifications/${janeNotifId}/read`)
      .set('X-CSRF-Token', userCsrf);
    expect(markOne.status).toBe(200);
    expect(markOne.body.data.notification.isRead).toBe(true);

    const markAll = await userAgent
      .patch('/api/v1/notifications/read-all')
      .set('X-CSRF-Token', userCsrf);
    expect(markAll.status).toBe(200);

    const unreadAfter = await userAgent.get('/api/v1/notifications/unread-count');
    expect(unreadAfter.body.data.unreadCount).toBe(0);

    // 6. Verify chronological activity history
    const activityRes = await userAgent.get(`/api/v1/tickets/${ticketId}/activities`);
    expect(activityRes.status).toBe(200);
    const eventTypes = activityRes.body.data.activities.map((a) => a.eventType);
    expect(eventTypes).toEqual([
      'ticket.created',
      'comment.added',
      'comment.added',
      'ticket.statusChanged',
      'ticket.statusChanged',
      'ticket.resolved',
    ]);

    // 7. Verify MongoDB aggregation dashboard stats for user & admin
    const userStats = await userAgent.get('/api/v1/dashboard/stats');
    expect(userStats.status).toBe(200);
    expect(userStats.body.data.totalTickets).toBe(1);
    expect(userStats.body.data.resolvedTickets).toBe(1);

    const adminStats = await adminAgent.get('/api/v1/dashboard/stats');
    expect(adminStats.status).toBe(200);
    expect(adminStats.body.data.totalTickets).toBe(1);
    expect(adminStats.body.data.recentActivities.length).toBeGreaterThanOrEqual(5);

    // 8. Priority change and ticket reopening create expected activities & owner notifications
    await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/priority`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ priority: 'Critical' });

    await adminAgent
      .patch(`/api/v1/admin/tickets/${ticketId}/status`)
      .set('X-CSRF-Token', adminCsrf)
      .send({ status: 'In Progress' });

    const ownerUnread = await userAgent.get('/api/v1/notifications/unread-count');
    expect(ownerUnread.body.data.unreadCount).toBe(2);

    const updatedActivities = await userAgent.get(`/api/v1/tickets/${ticketId}/activities`);
    const updatedTypes = updatedActivities.body.data.activities.map((a) => a.eventType);
    expect(updatedTypes).toContain('ticket.priorityChanged');
    const reopenActivity = updatedActivities.body.data.activities.find(
      (a) => a.metadata?.isReopened === true
    );
    expect(reopenActivity).toBeDefined();

    // 9. Another user cannot read ticket activities or comments
    const [otherComments, otherActivities] = await Promise.all([
      otherUserAgent.get(`/api/v1/tickets/${ticketId}/comments`),
      otherUserAgent.get(`/api/v1/tickets/${ticketId}/activities`),
    ]);
    expect(otherComments.status).toBe(403);
    expect(otherActivities.status).toBe(403);
  });

  test('logs event listener errors without crashing the API request', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const failingListener = () => {
      throw new Error('Simulated async listener failure');
    };
    appEvents.on(EVENT_TYPES.TICKET_CREATED, failingListener);

    try {
      const { agent: userAgent, csrfToken: userCsrf } = await createAuthenticatedAgent(app, {
        email: 'listener-err@example.com',
      });

      const res = await userAgent
        .post('/api/v1/tickets')
        .set('X-CSRF-Token', userCsrf)
        .send({
          title: 'Listener fault isolation',
          description: 'Verifies failing listener is caught and logged.',
          category: 'Other',
        });

      expect(res.status).toBe(201);
      expect(errorSpy).toHaveBeenCalledWith(
        '[Event Error:ticket.created]',
        'Simulated async listener failure'
      );
    } finally {
      appEvents.off(EVENT_TYPES.TICKET_CREATED, failingListener);
      errorSpy.mockRestore();
    }
  });
});
