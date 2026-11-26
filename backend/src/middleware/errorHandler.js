import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.errors.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path || 'identifier'} format`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Database validation failed';
    details = Object.values(err.errors).map((valErr) => ({
      field: valErr.path,
      message: valErr.message,
    }));
  } else if (err?.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with this ${duplicateField} already exists`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
  }

  if (statusCode >= 500 && !env.isTest) {
    console.error('[Server Error]', err.message);
  }

  const responseBody = {
    success: false,
    message,
  };

  if (details) {
    responseBody.errors = details;
  }

  // Never expose stack traces in API responses
  res.status(statusCode).json(responseBody);
}
