import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../../../prisma/generated/client';
import config from '../config/config';
import logger from '../config/logger';
import { TErrorSources } from '../interface';
import handleZodError from '../error/handleZodError';
import handlePrismaKnownError from '../error/handlePrismaKnownError';
import handlePrismaValidationError from '../error/handlePrismaValidationError';
import AppError from '../error/appError';


const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {

  // Log the full error through winston so it lands in logs/app.log
  logger.error('Global Error Handler', {
    message: err?.message,
    stack:   err?.stack,
    path:    req.path,
    method:  req.method,
  });

  // Default values
  let statusCode = err?.statusCode || 500;
  let message    = 'Something went wrong!';
  let errorSources: TErrorSources = [
    { path: '', message: 'Something went wrong' },
  ];

  // Zod validation error
  if (err instanceof ZodError) {
    const simplified = handleZodError(err);
    statusCode   = simplified.statusCode;
    message      = simplified.message;
    errorSources = simplified.errorSources;
  }

  // Prisma — known request errors (P2002 duplicate, P2025 not found, P2003 FK …)
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const simplified = handlePrismaKnownError(err);
    statusCode   = simplified.statusCode;
    message      = simplified.message;
    errorSources = simplified.errorSources;
  }

  // Prisma — validation error (bad types, missing required fields, invalid shape)
  else if (err instanceof Prisma.PrismaClientValidationError) {
    const simplified = handlePrismaValidationError(err);
    statusCode   = simplified.statusCode;
    message      = simplified.message;
    errorSources = simplified.errorSources;
  }

  // Operational app error
  else if (err instanceof AppError) {
    statusCode   = err.statusCode;
    message      = err.message;
    errorSources = [{ path: '', message: err.message }];
  }

  // Generic / unhandled JS error
  else if (err instanceof Error) {
    message      = err.message;
    errorSources = [{ path: '', message: err.message }];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: config.env === 'development' ? err?.stack : null,
  });
};


export default globalErrorHandler;