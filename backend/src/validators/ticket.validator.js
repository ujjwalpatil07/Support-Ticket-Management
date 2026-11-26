import { z } from 'zod';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../utils/constants.js';

const optionalEnum = (values) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.enum(values).optional()
  );

export const createTicketSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title cannot exceed 150 characters'),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(5, 'Description must be at least 5 characters')
      .max(5000, 'Description cannot exceed 5000 characters'),
    category: z.enum(TICKET_CATEGORIES).optional().default('Other'),
    priority: z.enum(TICKET_PRIORITIES).optional().default('Medium'),
  })
  .strict();

export const updateTicketSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title cannot exceed 150 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .min(5, 'Description must be at least 5 characters')
      .max(5000, 'Description cannot exceed 5000 characters')
      .optional(),
    category: z.enum(TICKET_CATEGORIES).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (title, description, category) must be provided',
  });

export const updateStatusSchema = z
  .object({
    status: z.enum(TICKET_STATUSES, {
      required_error: 'Status is required',
      invalid_type_error: 'Invalid ticket status',
    }),
  })
  .strict();

export const updatePrioritySchema = z
  .object({
    priority: z.enum(TICKET_PRIORITIES, {
      required_error: 'Priority is required',
      invalid_type_error: 'Invalid ticket priority',
    }),
  })
  .strict();

export const listTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().trim().max(100).optional()
  ),
  status: optionalEnum(TICKET_STATUSES),
  priority: optionalEnum(TICKET_PRIORITIES),
  category: optionalEnum(TICKET_CATEGORIES),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'priority', 'status', 'title'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
