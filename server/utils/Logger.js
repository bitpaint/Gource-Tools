/**
 * Enhanced Logger Utility
 * Provides structured logging with emojis for better readability
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

// Emoji mapping for log levels
const emojis = {
  info: '🔵',
  warn: '🟠',
  error: '🔴',
  debug: '🟣',
  success: '✅',
  start: '🚀',
  complete: '✨',
  config: '⚙️',
  db: '💾',
  network: '🌐',
  git: '📦',
  render: '🎬',
  user: '👤',
  system: '🖥️',
  time: '⏱️',
  file: '📄'
};

// Define enhanced log format with emojis
const logFormat = printf(({ level, message, timestamp, label, emoji }) => {
  const levelEmoji = emoji || emojis[level] || '';
  return `${levelEmoji} [${timestamp.split('T')[1].split('.')[0]}] ${message}`;
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
 * Create a component-specific logger with emojis
 * @param {string} component - Component name
 * @return {Object} Logger interface
 */
function createComponentLogger(component) {
  return {
    info: (message) => serverLogger.info(`[${component}] ${message}`),
    warn: (message) => serverLogger.warn(`[${component}] ${message}`),
    error: (message, error = null) => {
      if (error) {
        const errorMsg = `[${component}] ${message}: ${error instanceof Error ? error.message : error}`;
        serverLogger.error(errorMsg);
        errorLogger.error(errorMsg);
      } else {
        serverLogger.error(`[${component}] ${message}`);
        errorLogger.error(`[${component}] ${message}`);
      }
    },
    debug: (message) => serverLogger.debug(`[${component}] ${message}`),
    success: (message) => serverLogger.info({ message: `[${component}] ${message}`, emoji: emojis.success }),
    start: (message) => serverLogger.info({ message: `[${component}] ${message}`, emoji: emojis.start }),
    complete: (message) => serverLogger.info({ message: `[${component}] ${message}`, emoji: emojis.complete }),
    git: (message) => serverLogger.info({ message: `[${component}] ${message}`, emoji: emojis.git }),
    db: (message) => serverLogger.info({ message: `[${component}] ${message}`, emoji: emojis.db }),
    render: (message) => serverLogger.info({ message: `[${component}] ${message}`, emoji: emojis.render }),
    config: (message) => serverLogger.info({ message: `[${component}] ${message}`, emoji: emojis.config }),
    time: (message) => serverLogger.info({ message: `[${component}] ${message}`, emoji: emojis.time }),
    file: (message) => serverLogger.info({ message: `[${component}] ${message}`, emoji: emojis.file })
  };
}

/**
 * Create a render-specific logger with emojis
 * @param {string} renderId - Render ID 
 * @return {Object} Logger interface
 */
function createRenderLogger(renderId) {
  return {
    info: (message) => renderLogger.info(`[Render ${renderId}] ${message}`),
    warn: (message) => renderLogger.warn(`[Render ${renderId}] ${message}`),
    error: (message, error = null) => {
      if (error) {
        const errorMsg = `[Render ${renderId}] ${message}: ${error instanceof Error ? error.message : error}`;
        renderLogger.error(errorMsg);
        errorLogger.error(errorMsg);
      } else {
        renderLogger.error(`[Render ${renderId}] ${message}`);
        errorLogger.error(`[Render ${renderId}] ${message}`);
      }
    },
    debug: (message) => renderLogger.debug(`[Render ${renderId}] ${message}`),
    progress: (percent, stage) => renderLogger.info({ 
      message: `[Render ${renderId}] ${stage || 'Progress'}: ${percent}%`, 
      emoji: emojis.time 
    }),
    start: (message) => renderLogger.info({ 
      message: `[Render ${renderId}] ${message}`, 
      emoji: emojis.start 
    }),
    complete: (message) => renderLogger.info({ 
      message: `[Render ${renderId}] ${message}`, 
      emoji: emojis.complete 
    })
  };
}

module.exports = {
  serverLogger,
  renderLogger,
  errorLogger,
  createComponentLogger,
  createRenderLogger,
  emojis
}; 