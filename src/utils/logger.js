/**
 * Simple logging utility for MCP server
 */

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Set default log level from environment or use INFO
const currentLogLevel = process.env.LOG_LEVEL ? 
  logLevels[process.env.LOG_LEVEL.toUpperCase()] : 
  logLevels.INFO;

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 * @returns {string} Formatted log message
 */
function formatLog(level, message, data) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    // Clean sensitive data
    const cleanedData = cleanSensitiveData(data);
    logMessage += "\n" + JSON.stringify(cleanedData, null, 2);
  }
  
  return logMessage;
}

/**
 * Remove sensitive data from logs
 * @param {Object} data - Data to clean
 * @returns {Object} Cleaned data
 */
function cleanSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['apiKey', 'password', 'secret', 'token', 'key'];
  const cleanedData = { ...data };
  
  for (const key of Object.keys(cleanedData)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      cleanedData[key] = '[REDACTED]';
    } else if (typeof cleanedData[key] === 'object' && cleanedData[key] !== null) {
      cleanedData[key] = cleanSensitiveData(cleanedData[key]);
    }
  }
  
  return cleanedData;
}

/**
 * Log error messages
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or data
 */
export function logError(message, error) {
  if (currentLogLevel >= logLevels.ERROR) {
    const errorData = error instanceof Error ? 
      { message: error.message, stack: error.stack } : 
      error;
    
    console.error(formatLog('ERROR', message, errorData));
  }
}

/**
 * Log warning messages
 * @param {string} message - Warning message
 * @param {Object} data - Optional data
 */
export function logWarn(message, data) {
  if (currentLogLevel >= logLevels.WARN) {
    console.warn(formatLog('WARN', message, data));
  }
}

/**
 * Log info messages
 * @param {string} message - Info message
 * @param {Object} data - Optional data
 */
export function logInfo(message, data) {
  if (currentLogLevel >= logLevels.INFO) {
    console.info(formatLog('INFO', message, data));
  }
}

/**
 * Log debug messages
 * @param {string} message - Debug message
 * @param {Object} data - Optional data
 */
export function logDebug(message, data) {
  if (currentLogLevel >= logLevels.DEBUG) {
    console.debug(formatLog('DEBUG', message, data));
  }
}
