import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError } from './validation';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Log the error for debugging
  request.log.error(error);

  // Handle validation errors
  if (error instanceof ValidationError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      field: (error as any).field,
      statusCode: 400
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: error.validation,
      statusCode: 400
    });
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return reply.status(400).send({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      statusCode: 400
    });
  }

  // Handle rate limiting errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: 429
    });
  }

  // Handle 404 errors
  if (error.statusCode === 404) {
    return reply.status(404).send({
      error: 'Not Found',
      message: 'The requested resource was not found',
      statusCode: 404
    });
  }

  // Handle 405 Method Not Allowed
  if (error.statusCode === 405) {
    return reply.status(405).send({
      error: 'Method Not Allowed',
      message: 'The HTTP method is not allowed for this endpoint',
      statusCode: 405
    });
  }

  // Handle 413 Payload Too Large
  if (error.statusCode === 413) {
    return reply.status(413).send({
      error: 'Payload Too Large',
      message: 'The request payload is too large',
      statusCode: 413
    });
  }

  // Handle 415 Unsupported Media Type
  if (error.statusCode === 415) {
    return reply.status(415).send({
      error: 'Unsupported Media Type',
      message: 'The request content type is not supported',
      statusCode: 415
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const response: any = {
    error: 'Internal Server Error',
    message: isDevelopment ? message : 'Something went wrong',
    statusCode
  };

  // Include stack trace in development
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
  }

  return reply.status(statusCode).send(response);
}

// Custom error for rate limiting
export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Custom error for authentication
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Custom error for authorization
export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}
