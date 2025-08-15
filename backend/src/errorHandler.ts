/**
 * Transcendence Backend Error Handler
 * 
 * This module provides comprehensive error handling for the Transcendence backend server.
 * It includes a centralized error handler function for processing all application errors.
 * 
 * Features:
 * - Centralized error handling for all routes
 * - Validation error handling
 * - Rate limiting error handling
 * - HTTP method and media type error handling
 * - Development vs production error responses
 * - Structured error logging
 * 
 * @author Vincent Spinosa
 * @version 1.0.0
 */

// Import required types from Fastify for type safety
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
// Import custom validation error class for handling validation failures
import { ValidationError } from './validation';

/**
 * Central Error Handler Function
 * 
 * This is the main error handler that processes all errors thrown in the application.
 * It categorizes errors by type and returns appropriate HTTP status codes and
 * error messages based on the error context.
 * 
 * The handler ensures consistent error responses across the application and
 * provides appropriate error details for debugging while maintaining security
 * in production environments.
 * 
 * @param error - The error object that was thrown
 * @param request - The Fastify request object containing request details
 * @param reply - The Fastify reply object for sending responses
 * @returns FastifyReply - The error response with appropriate status code and message
 */
export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Log the error for debugging and monitoring purposes
  // This helps developers identify and fix issues in production
  request.log.error(error);

  // Handle custom validation errors from our validation module
  // These errors are thrown when input validation fails
  if (error instanceof ValidationError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,                    // Custom validation message
      field: (error as any).field,              // Field that failed validation
      statusCode: 400                           // Bad Request status code
    });
  }

  // Handle Fastify's built-in validation errors
  // These occur when request body/query/params don't match the defined schema
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: error.validation,                // Detailed validation error information
      statusCode: 400
    });
  }

  // Handle JSON parsing errors
  // These occur when the request body contains malformed JSON
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return reply.status(400).send({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      statusCode: 400
    });
  }

  // Handle rate limiting errors (HTTP 429)
  // These occur when a client exceeds the allowed request rate
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: 429
    });
  }

  // Handle 404 Not Found errors
  // These occur when a requested resource doesn't exist
  if (error.statusCode === 404) {
    return reply.status(404).send({
      error: 'Not Found',
      message: 'The requested resource was not found',
      statusCode: 404
    });
  }

  // Handle 405 Method Not Allowed errors
  // These occur when an HTTP method is not supported for a given endpoint
  if (error.statusCode === 405) {
    return reply.status(405).send({
      error: 'Method Not Allowed',
      message: 'The HTTP method is not allowed for this endpoint',
      statusCode: 405
    });
  }

  // Handle 413 Payload Too Large errors
  // These occur when the request body exceeds the maximum allowed size
  if (error.statusCode === 413) {
    return reply.status(413).send({
      error: 'Payload Too Large',
      message: 'The request payload is too large',
      statusCode: 413
    });
  }

  // Handle 415 Unsupported Media Type errors
  // These occur when the request content type is not supported
  if (error.statusCode === 415) {
    return reply.status(415).send({
      error: 'Unsupported Media Type',
      message: 'The request content type is not supported',
      statusCode: 415
    });
  }

  // Default error response for unhandled errors
  // This catches any errors that don't match the above conditions
  const statusCode = error.statusCode || 500;  // Default to 500 if no status code
  const message = error.message || 'Internal Server Error';

  // Security consideration: Don't expose internal errors in production
  // This prevents information leakage that could aid attackers
  const isDevelopment = process.env.NODE_ENV === 'development';
  const response: any = {
    error: 'Internal Server Error',
    message: isDevelopment ? message : 'Something went wrong',  // Generic message in production
    statusCode
  };

  // Include stack trace only in development environment
  // Stack traces can contain sensitive information and should not be exposed in production
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
  }

  return reply.status(statusCode).send(response);
}
