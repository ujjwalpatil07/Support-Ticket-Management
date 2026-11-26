import { Activity } from '../models/Activity.js';
import { Ticket } from '../models/Ticket.js';
import {
  ROLES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../utils/constants.js';

function mapFacetCounts(entries, allowedKeys) {
  const counts = {};
  for (const key of allowedKeys) {
    counts[key] = 0;
  }
  for (const entry of entries || []) {
    if (entry._id && Object.prototype.hasOwnProperty.call(counts, entry._id)) {
      counts[entry._id] = entry.count;
    }
  }
  return counts;
}

export async function getDashboardStats(user) {
  const isAdmin = user.role === ROLES.ADMIN;
  const matchStage = { isDeleted: false };

  if (!isAdmin) {
    matchStage.createdBy = user._id;
  }

  const [aggregation] = await Ticket.aggregate([
    { $match: matchStage },
    {
      $facet: {
        totalCount: [{ $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
      },
    },
  ]);

  const totalTickets = aggregation?.totalCount?.[0]?.count || 0;
  const statusCounts = mapFacetCounts(aggregation?.byStatus, TICKET_STATUSES);
  const priorityCounts = mapFacetCounts(aggregation?.byPriority, TICKET_PRIORITIES);

  const recentTickets = await Ticket.find(matchStage)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('createdBy', 'name email role')
    .lean();

  const baseStats = {
    totalTickets,
    openTickets: statusCounts.Open,
    inProgressTickets: statusCounts['In Progress'],
    resolvedTickets: statusCounts.Resolved,
    closedTickets: statusCounts.Closed,
    statusDistribution: TICKET_STATUSES.map((status) => ({
      name: status,
      value: statusCounts[status],
    })),
    priorityDistribution: TICKET_PRIORITIES.map((priority) => ({
      name: priority,
      value: priorityCounts[priority],
    })),
    recentTickets,
  };

  if (!isAdmin) {
    return baseStats;
  }

  const recentActivities = await Activity.find({})
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('actor', 'name email role')
    .populate('ticket', 'title status priority isDeleted')
    .lean();

  return {
    ...baseStats,
    recentActivities,
  };
}
