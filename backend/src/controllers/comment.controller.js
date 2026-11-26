import { asyncHandler } from '../utils/asyncHandler.js';
import * as commentService from '../services/comment.service.js';

export const addComment = asyncHandler(async (req, res) => {
  const comment = await commentService.addComment(
    req.params.ticketId,
    req.body.message,
    req.user
  );

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: { comment },
  });
});

export const getComments = asyncHandler(async (req, res) => {
  const comments = await commentService.getCommentsByTicket(
    req.params.ticketId,
    req.user
  );

  res.status(200).json({
    success: true,
    data: { comments },
  });
});
