import { asyncHandler } from '../utils/asyncHandler.js';
import * as activityService from '../services/activity.service.js';

export const getTicketActivities = asyncHandler(async (req, res) => {
  const activities = await activityService.getTicketActivities(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: { activities },
  });
});
