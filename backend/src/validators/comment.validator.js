import { z } from 'zod';

export const createCommentSchema = z
  .object({
    message: z
      .string({ required_error: 'Comment message is required' })
      .trim()
      .min(1, 'Comment message cannot be empty')
      .max(2000, 'Comment cannot exceed 2000 characters'),
  })
  .strict();
