/**
 * Logger Utility
 * Provides structured logging functions
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL'
};

// Current log level (can be overridden by environment variable)
const currentLogLevel = process.env.LOG_LEVEL || LOG_LEVELS.INFO;

// Log level priorities
const LOG_LEVEL_PRIORITIES = {
  [LOG_LEVELS.DEBUG]: 0,
  [LOG_LEVELS.INFO]: 1,
  [LOG_LEVELS.WARN]: 2,
  [LOG_LEVELS.ERROR]: 3,
  [LOG_LEVELS.FATAL]: 4
};

/**
 * Should this message be logged based on its level?
 * @param {string} level - Log level
 * @returns {boolean} true if message should be logged
 */
function shouldLog(level) {
  const messagePriority = LOG_LEVEL_PRIORITIES[level] || 0;
  const currentPriority = LOG_LEVEL_PRIORITIES[currentLogLevel] || 0;
  return messagePriority >= currentPriority;
}

/**
 * Format a log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  
  // Basic message
  let logMessage = `${prefix} ${message}`;
  
  // Add data if provided
  if (data) {
    if (typeof data === 'object') {
      try {
        const dataString = JSON.stringify(data);
        logMessage += ` - ${dataString}`;
      } catch (error) {
        logMessage += ` - [Object could not be serialized]`;
      }
    } else {
      logMessage += ` - ${data}`;
    }
  }
  
  return logMessage;
}

/**
 * Log a debug message
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
function debug(message, data = null) {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    console.log(formatLogMessage(LOG_LEVELS.DEBUG, message, data));
  }
}

/**
 * Log an info message
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
function info(message, data = null) {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.log(formatLogMessage(LOG_LEVELS.INFO, message, data));
  }
}

/**
 * Log a warning message
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
function warn(message, data = null) {
  if (shouldLog(LOG_LEVELS.WARN)) {
    console.warn(formatLogMessage(LOG_LEVELS.WARN, message, data));
  }
}

/**
 * Log an error message
 * @param {string} message - Log message
 * @param {Error|Object} error - Error object or additional data
 */
function error(message, error = null) {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    if (error instanceof Error) {
      console.error(formatLogMessage(LOG_LEVELS.ERROR, message, {
        message: error.message,
        stack: error.stack
      }));
    } else {
      console.error(formatLogMessage(LOG_LEVELS.ERROR, message, error));
    }
  }
}

/**
 * Log a fatal error message
 * @param {string} message - Log message
 * @param {Error|Object} error - Error object or additional data
 */
function fatal(message, error = null) {
  if (shouldLog(LOG_LEVELS.FATAL)) {
    if (error instanceof Error) {
      console.error(formatLogMessage(LOG_LEVELS.FATAL, message, {
        message: error.message,
        stack: error.stack
      }));
    } else {
      console.error(formatLogMessage(LOG_LEVELS.FATAL, message, error));
    }
  }
}

/**
 * Create a logger for a specific component
 * @param {string} component - Component name
 * @returns {Object} Logger with component prefix
 */
function createComponentLogger(component) {
  return {
    debug: (message, data) => debug(`[${component}] ${message}`, data),
    info: (message, data) => info(`[${component}] ${message}`, data),
    warn: (message, data) => warn(`[${component}] ${message}`, data),
    error: (message, error) => error(`[${component}] ${message}`, error),
    fatal: (message, error) => fatal(`[${component}] ${message}`, error)
  };
}

module.exports = {
  LOG_LEVELS,
  debug,
  info,
  warn,
  error,
  fatal,
  createComponentLogger
}; 