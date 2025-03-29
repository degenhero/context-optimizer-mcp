/**
 * Simple metrics collection for MCP server performance
 */

const metrics = {
  requests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalProcessingTime: 0,
  tokensCounted: 0,
  optimizedContexts: 0,
  cachedSummariesUsed: 0,
  newSummariesCreated: 0,
  lastResetTime: Date.now(),
};

/**
 * Increment a metric counter
 * @param {string} metric - Metric name
 * @param {number} value - Value to increment by (default: 1)
 */
export function incrementMetric(metric, value = 1) {
  if (metrics[metric] !== undefined) {
    metrics[metric] += value;
  }
}

/**
 * Record request processing time
 * @param {number} timeMs - Processing time in milliseconds
 */
export function recordProcessingTime(timeMs) {
  metrics.totalProcessingTime += timeMs;
}

/**
 * Get current metrics
 * @returns {Object} Current metrics
 */
export function getMetrics() {
  const currentTime = Date.now();
  const uptimeMs = currentTime - metrics.lastResetTime;
  
  return {
    ...metrics,
    uptime: uptimeMs,
    averageProcessingTime: metrics.requests > 0 ? 
      metrics.totalProcessingTime / metrics.requests : 
      0,
    requestsPerMinute: metrics.requests > 0 ? 
      (metrics.requests / (uptimeMs / 1000 / 60)).toFixed(2) : 
      0,
  };
}

/**
 * Reset all metrics
 */
export function resetMetrics() {
  Object.keys(metrics).forEach(key => {
    metrics[key] = 0;
  });
  metrics.lastResetTime = Date.now();
}
