/**
 * Logger Utility
 * Provides structured logging functions
 */

const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, colorize } = format;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = printf(({ level, message, timestamp, label }) => {
  return `[${timestamp}] [${level.toUpperCase()}]${label ? ` [${label}]` : ''} ${message}`;
});

// Create logger with file and console transport
const serverLogger = createLogger({
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.File({ 
      filename: path.join(logsDir, 'server.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        logFormat
      )
    })
  ]
});

// Additional logger for render operations
const renderLogger = createLogger({
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.File({ 
      filename: path.join(logsDir, 'render.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        logFormat
      )
    })
  ]
});

// Error-specific logger
const errorLogger = createLogger({
  level: 'error',
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        logFormat
      )
    })
  ]
});

/**
 * Create a component-specific logger
 * @param {string} component - Component name
 * @return {Object} Logger interface
 */
function createComponentLogger(component) {
  return {
    info: (message) => serverLogger.info(`[${component}] ${message}`),
    warn: (message) => serverLogger.warn(`[${component}] ${message}`),
    error: (message, error = null) => {
      if (error) {
        serverLogger.error(`[${component}] ${message}`, { error: error instanceof Error ? error.stack : error });
        errorLogger.error(`[${component}] ${message}`, { error: error instanceof Error ? error.stack : error });
      } else {
        serverLogger.error(`[${component}] ${message}`);
        errorLogger.error(`[${component}] ${message}`);
      }
    },
    debug: (message) => serverLogger.debug(`[${component}] ${message}`),
  };
}

/**
 * Create a render-specific logger
 * @param {string} renderId - Render ID 
 * @return {Object} Logger interface
 */
function createRenderLogger(renderId) {
  return {
    info: (message) => renderLogger.info(`[Render ${renderId}] ${message}`),
    warn: (message) => renderLogger.warn(`[Render ${renderId}] ${message}`),
    error: (message, error = null) => {
      if (error) {
        renderLogger.error(`[Render ${renderId}] ${message}`, { error: error instanceof Error ? error.stack : error });
        errorLogger.error(`[Render ${renderId}] ${message}`, { error: error instanceof Error ? error.stack : error });
      } else {
        renderLogger.error(`[Render ${renderId}] ${message}`);
        errorLogger.error(`[Render ${renderId}] ${message}`);
      }
    },
    debug: (message) => renderLogger.debug(`[Render ${renderId}] ${message}`),
  };
}

module.exports = {
  serverLogger,
  renderLogger,
  errorLogger,
  createComponentLogger,
  createRenderLogger
}; 