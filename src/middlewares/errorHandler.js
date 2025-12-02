import { config } from '../config/index.js';

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  const response = {
    error: message,
    ...(config.nodeEnv === 'development' && {
      stack: err.stack,
      details: err.details,
    }),
  };

  res.status(statusCode).json(response);
}

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
  });
}

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
