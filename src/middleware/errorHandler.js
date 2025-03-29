import { logError } from '../utils/logger.js';

/**
 * Global error handling middleware
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  
  // Log error details
  logError(`Request error: ${err.message}`, err);
  
  // Send appropriate response to client
  res.status(statusCode).json({
    error: {
      type: err.type || 'server_error',
      message: err.message || 'An unexpected error occurred',
      code: err.code || 'internal_error'
    }
  });
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, type = 'server_error', code = 'internal_error') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.code = code;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
  
  static badRequest(message, code = 'bad_request') {
    return new ApiError(message, 400, 'invalid_request_error', code);
  }
  
  static unauthorized(message, code = 'unauthorized') {
    return new ApiError(message, 401, 'authentication_error', code);
  }
  
  static forbidden(message, code = 'forbidden') {
    return new ApiError(message, 403, 'permission_error', code);
  }
  
  static notFound(message = 'Resource not found', code = 'not_found') {
    return new ApiError(message, 404, 'not_found_error', code);
  }
  
  static tooManyRequests(message = 'Rate limit exceeded', code = 'rate_limit_exceeded') {
    return new ApiError(message, 429, 'rate_limit_error', code);
  }
  
  static serverError(message = 'Internal server error', code = 'internal_error') {
    return new ApiError(message, 500, 'server_error', code);
  }
}
