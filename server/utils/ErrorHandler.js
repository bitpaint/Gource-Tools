/**
 * Error Handler Utility
 * Provides centralized error handling functions
 */

/**
 * Standard HTTP error responses
 */
const HTTP_ERRORS = {
  BAD_REQUEST: { status: 400, message: 'Bad Request' },
  UNAUTHORIZED: { status: 401, message: 'Unauthorized' },
  FORBIDDEN: { status: 403, message: 'Forbidden' },
  NOT_FOUND: { status: 404, message: 'Not Found' },
  CONFLICT: { status: 409, message: 'Conflict' },
  INTERNAL_SERVER_ERROR: { status: 500, message: 'Internal Server Error' },
  SERVICE_UNAVAILABLE: { status: 503, message: 'Service Unavailable' }
};

/**
 * Handle application errors and send appropriate HTTP responses
 * @param {Error} error - The error to handle
 * @param {Object} res - Express response object
 */
function handleError(error, res) {
  console.error('Application error:', error);
  
  // If the error has a status property, use it
  if (error.status) {
    res.status(error.status).json({
      error: error.message || 'Unknown error',
      details: error.details || null
    });
    return;
  }
  
  // Default to internal server error
  res.status(500).json({
    error: 'Internal Server Error',
    details: error.message || null
  });
}

/**
 * Create an application error with HTTP status code
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {any} details - Additional error details
 * @returns {Error} Error object with status and details
 */
function createError(status, message, details = null) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

/**
 * Create a Bad Request error (400)
 * @param {string} message - Error message
 * @param {any} details - Additional error details
 * @returns {Error} Error object
 */
function badRequest(message = HTTP_ERRORS.BAD_REQUEST.message, details = null) {
  return createError(HTTP_ERRORS.BAD_REQUEST.status, message, details);
}

/**
 * Create a Not Found error (404)
 * @param {string} message - Error message
 * @param {any} details - Additional error details
 * @returns {Error} Error object
 */
function notFound(message = HTTP_ERRORS.NOT_FOUND.message, details = null) {
  return createError(HTTP_ERRORS.NOT_FOUND.status, message, details);
}

/**
 * Create a Conflict error (409)
 * @param {string} message - Error message
 * @param {any} details - Additional error details
 * @returns {Error} Error object
 */
function conflict(message = HTTP_ERRORS.CONFLICT.message, details = null) {
  return createError(HTTP_ERRORS.CONFLICT.status, message, details);
}

/**
 * Create a Forbidden error (403)
 * @param {string} message - Error message
 * @param {any} details - Additional error details
 * @returns {Error} Error object
 */
function forbidden(message = HTTP_ERRORS.FORBIDDEN.message, details = null) {
  return createError(HTTP_ERRORS.FORBIDDEN.status, message, details);
}

/**
 * Create an Internal Server Error (500)
 * @param {string} message - Error message
 * @param {any} details - Additional error details
 * @returns {Error} Error object
 */
function serverError(message = HTTP_ERRORS.INTERNAL_SERVER_ERROR.message, details = null) {
  return createError(HTTP_ERRORS.INTERNAL_SERVER_ERROR.status, message, details);
}

/**
 * Handle validation errors
 * @param {Object} validation - Validation result
 * @param {Object} res - Express response object
 * @returns {boolean} true if validation passed, false if validation failed and response was sent
 */
function handleValidationError(validation, res) {
  if (!validation.valid) {
    res.status(HTTP_ERRORS.BAD_REQUEST.status).json({ 
      error: validation.message 
    });
    return false;
  }
  return true;
}

module.exports = {
  HTTP_ERRORS,
  handleError,
  createError,
  badRequest,
  notFound,
  conflict,
  forbidden,
  serverError,
  handleValidationError
}; 