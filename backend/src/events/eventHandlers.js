import { Activity } from '../models/Activity.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ROLES } from '../utils/constants.js';
import { appEvents } from './eventEmitter.js';
import { EVENT_TYPES } from './eventTypes.js';

function isSameUser(a, b) {
  if (!a || !b) return false;
  return String(a) === String(b);
}

let handlersRegistered = false;

async function getActiveAdminIds(excludeUserId = null) {
  const query = { role: ROLES.ADMIN, isActive: true };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const admins = await User.find(query).select('_id').lean();
  return admins.map((admin) => admin._id);
}

async function createNotificationsForRecipients({
  recipientIds,
  ticketId,
  activityId,
  type,
  title,
  message,
}) {
  if (!recipientIds || recipientIds.length === 0) {
    return;
  }

  const docs = recipientIds.map((recipientId) => ({
    recipient: recipientId,
    ticket: ticketId,
    activity: activityId || null,
    type,
    title,
    message,
  }));

  await Notification.insertMany(docs);
}

export function registerEventHandlers() {
  if (handlersRegistered) {
    return;
  }
  handlersRegistered = true;

  appEvents.on(EVENT_TYPES.TICKET_CREATED, async ({ ticket, actor }) => {
    const activity = await Activity.create({
      ticket: ticket._id,
      actor: actor._id,
      eventType: EVENT_TYPES.TICKET_CREATED,
      description: `Ticket created by ${actor.name} with priority "${ticket.priority}"`,
      metadata: {
        title: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
      },
    });

    const adminIds = await getActiveAdminIds(
      actor.role === ROLES.ADMIN ? actor._id : null
    );

    await createNotificationsForRecipients({
      recipientIds: adminIds,
      ticketId: ticket._id,
      activityId: activity._id,
      type: EVENT_TYPES.TICKET_CREATED,
      title: 'New Support Ticket',
      message: `${actor.name} submitted "${ticket.title}" (${ticket.priority} priority).`,
    });
  });

  appEvents.on(EVENT_TYPES.TICKET_UPDATED, async ({ ticket, actor, changedFields }) => {
    await Activity.create({
      ticket: ticket._id,
      actor: actor._id,
      eventType: EVENT_TYPES.TICKET_UPDATED,
      description: `${actor.name} updated ticket details (${changedFields.join(', ')})`,
      metadata: {
        changedFields,
      },
    });
  });

  appEvents.on(
    EVENT_TYPES.TICKET_STATUS_CHANGED,
    async ({ ticket, actor, previousStatus, newStatus, isReopened }) => {
      const description = isReopened
        ? `${actor.name} reopened ticket (status changed from "${previousStatus}" to "${newStatus}")`
        : `${actor.name} changed status from "${previousStatus}" to "${newStatus}"`;

      const activity = await Activity.create({
        ticket: ticket._id,
        actor: actor._id,
        eventType: EVENT_TYPES.TICKET_STATUS_CHANGED,
        description,
        metadata: {
          previousStatus,
          newStatus,
          isReopened: Boolean(isReopened),
        },
      });

      // Avoid duplicate notification when ticket.resolved also fires for the same transition
      if (newStatus === 'Resolved') {
        return;
      }

      const ownerId = ticket.createdBy?._id || ticket.createdBy;
      if (ownerId && !isSameUser(ownerId, actor._id)) {
        await createNotificationsForRecipients({
          recipientIds: [ownerId],
          ticketId: ticket._id,
          activityId: activity._id,
          type: isReopened ? 'ticket.reopened' : EVENT_TYPES.TICKET_STATUS_CHANGED,
          title: isReopened ? 'Ticket Reopened' : 'Ticket Status Updated',
          message: isReopened
            ? `Your ticket "${ticket.title}" was reopened and is now "${newStatus}".`
            : `Status of "${ticket.title}" changed from "${previousStatus}" to "${newStatus}".`,
        });
      }
    }
  );

  appEvents.on(EVENT_TYPES.TICKET_RESOLVED, async ({ ticket, actor }) => {
    const activity = await Activity.create({
      ticket: ticket._id,
      actor: actor._id,
      eventType: EVENT_TYPES.TICKET_RESOLVED,
      description: `Ticket marked as Resolved by ${actor.name}`,
      metadata: {
        resolvedAt: ticket.resolvedAt,
      },
    });

    const ownerId = ticket.createdBy?._id || ticket.createdBy;
    if (ownerId && !isSameUser(ownerId, actor._id)) {
      await createNotificationsForRecipients({
        recipientIds: [ownerId],
        ticketId: ticket._id,
        activityId: activity._id,
        type: EVENT_TYPES.TICKET_RESOLVED,
        title: 'Ticket Resolved',
        message: `Your ticket "${ticket.title}" has been marked as Resolved.`,
      });
    }
  });

  appEvents.on(
    EVENT_TYPES.TICKET_PRIORITY_CHANGED,
    async ({ ticket, actor, previousPriority, newPriority }) => {
      const activity = await Activity.create({
        ticket: ticket._id,
        actor: actor._id,
        eventType: EVENT_TYPES.TICKET_PRIORITY_CHANGED,
        description: `${actor.name} changed priority from "${previousPriority}" to "${newPriority}"`,
        metadata: {
          previousPriority,
          newPriority,
        },
      });

      const ownerId = ticket.createdBy?._id || ticket.createdBy;
      if (ownerId && !isSameUser(ownerId, actor._id)) {
        await createNotificationsForRecipients({
          recipientIds: [ownerId],
          ticketId: ticket._id,
          activityId: activity._id,
          type: EVENT_TYPES.TICKET_PRIORITY_CHANGED,
          title: 'Ticket Priority Updated',
          message: `Priority of "${ticket.title}" changed from "${previousPriority}" to "${newPriority}".`,
        });
      }
    }
  );

  appEvents.on(EVENT_TYPES.COMMENT_ADDED, async ({ ticket, comment, actor }) => {
    const activity = await Activity.create({
      ticket: ticket._id,
      actor: actor._id,
      eventType: EVENT_TYPES.COMMENT_ADDED,
      description: `${actor.name} added a comment`,
      metadata: {
        commentId: comment._id,
        authorRole: actor.role,
      },
    });

    const ownerId = ticket.createdBy?._id || ticket.createdBy;

    if (actor.role === ROLES.ADMIN) {
      if (ownerId && !isSameUser(ownerId, actor._id)) {
        await createNotificationsForRecipients({
          recipientIds: [ownerId],
          ticketId: ticket._id,
          activityId: activity._id,
          type: EVENT_TYPES.COMMENT_ADDED,
          title: 'New Admin Reply',
          message: `${actor.name} replied to your ticket "${ticket.title}".`,
        });
      }
    } else {
      const adminIds = await getActiveAdminIds();
      await createNotificationsForRecipients({
        recipientIds: adminIds,
        ticketId: ticket._id,
        activityId: activity._id,
        type: EVENT_TYPES.COMMENT_ADDED,
        title: 'New User Comment',
        message: `${actor.name} commented on "${ticket.title}".`,
      });
    }
  });

  appEvents.on(EVENT_TYPES.TICKET_DELETED, async ({ ticket, actor }) => {
    await Activity.create({
      ticket: ticket._id,
      actor: actor._id,
      eventType: EVENT_TYPES.TICKET_DELETED,
      description: `Ticket soft-deleted by ${actor.name}`,
      metadata: {
        deletedAt: ticket.deletedAt,
      },
    });
  });
}
