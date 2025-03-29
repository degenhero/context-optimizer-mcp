import { getRedisClient } from '../caching/redisCache.js';
import { ApiError } from './errorHandler.js';

// Default rate limits
const DEFAULT_RATE_LIMIT = 60; // requests per minute
const DEFAULT_BURST_LIMIT = 10; // max concurrent requests

/**
 * Redis-based rate limiter middleware
 * Uses a rolling window algorithm with Redis
 */
export function createRateLimiter(options = {}) {
  const rateLimit = options.requestsPerMinute || process.env.RATE_LIMIT || DEFAULT_RATE_LIMIT;
  const burstLimit = options.maxConcurrent || process.env.BURST_LIMIT || DEFAULT_BURST_LIMIT;
  const redis = getRedisClient();
  
  return async function rateLimiterMiddleware(req, res, next) {
    let clientId;
    
    // Identify client by API key or IP address
    if (req.headers['x-api-key']) {
      clientId = `ratelimit:${req.headers['x-api-key']}`;
    } else {
      clientId = `ratelimit:${req.ip}`;
    }
    
    try {
      // Use Redis to track request counts
      const now = Math.floor(Date.now() / 1000);
      const windowKey = `${clientId}:${Math.floor(now / 60)}`;
      
      // Check concurrent requests
      const concurrentKey = `${clientId}:concurrent`;
      const currentConcurrent = await redis.incr(concurrentKey);
      
      // Set expiry for concurrent key
      await redis.expire(concurrentKey, 60);
      
      if (currentConcurrent > burstLimit) {
        // Decrement since we're rejecting this request
        await redis.decr(concurrentKey);
        throw ApiError.tooManyRequests('Too many concurrent requests');
      }
      
      // Increment window counter
      const requestCount = await redis.incr(windowKey);
      
      // Set expiry for window key
      await redis.expire(windowKey, 60);
      
      if (requestCount > rateLimit) {
        // Decrement concurrent counter
        await redis.decr(concurrentKey);
        throw ApiError.tooManyRequests();
      }
      
      // Add headers to indicate rate limit status
      res.setHeader('X-RateLimit-Limit', rateLimit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimit - requestCount));
      res.setHeader('X-RateLimit-Reset', (Math.floor(now / 60) + 1) * 60);
      
      // Set up cleanup of concurrent counter when response is sent
      res.on('finish', async () => {
        await redis.decr(concurrentKey);
      });
      
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        // If Redis fails, allow the request but log the error
        console.error('Rate limiter error:', error);
        next();
      }
    }
  };
}
