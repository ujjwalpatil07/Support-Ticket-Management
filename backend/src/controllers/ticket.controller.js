import { asyncHandler } from '../utils/asyncHandler.js';
import * as ticketService from '../services/ticket.service.js';

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.body, req.user);

  res.status(201).json({
    success: true,
    message: 'Ticket created successfully',
    data: { ticket },
  });
});

export const listTickets = asyncHandler(async (req, res) => {
  const result = await ticketService.listTickets(req.query, req.user);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: { ticket },
  });
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicket(req.params.id, req.body, req.user);

  res.status(200).json({
    success: true,
    message: 'Ticket updated successfully',
    data: { ticket },
  });
});

export const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.softDeleteTicket(req.params.id, req.user);

  res.status(200).json({
    success: true,
    message: 'Ticket deleted successfully',
    data: { ticketId: ticket._id },
  });
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicketStatus(
    req.params.id,
    req.body.status,
    req.user
  );

  res.status(200).json({
    success: true,
    message: `Ticket status updated to ${ticket.status}`,
    data: { ticket },
  });
});

export const updateTicketPriority = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicketPriority(
    req.params.id,
    req.body.priority,
    req.user
  );

  res.status(200).json({
    success: true,
    message: `Ticket priority updated to ${ticket.priority}`,
    data: { ticket },
  });
});
