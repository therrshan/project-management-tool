import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Resource already exists',
          message: 'A record with this information already exists'
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Resource not found',
          message: 'The requested resource does not exist'
        });
      case 'P2003':
        return res.status(400).json({
          error: 'Invalid reference',
          message: 'Referenced record does not exist'
        });
      default:
        return res.status(500).json({
          error: 'Database error',
          message: 'An error occurred while processing your request'
        });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Invalid data',
      message: 'The provided data is invalid'
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.isOperational 
    ? error.message 
    : 'Internal server error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      error: message,
      stack: error.stack,
      details: error.message
    });
  }

  res.status(statusCode).json({
    error: message
  });
};

export const createError = (message: string, statusCode: number): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};