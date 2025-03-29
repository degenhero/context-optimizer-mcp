import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { optimizedCompletion } from './src/completion.js';
import { tokenCount } from './src/tokenizer.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { createRateLimiter } from './src/middleware/rateLimiter.js';
import { logInfo, logError } from './src/utils/logger.js';
import { getMetrics, incrementMetric, resetMetrics } from './src/utils/metrics.js';
import { getRedisClient, closeRedisConnection } from './src/caching/redisCache.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const redisClient = getRedisClient();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Add request ID to all requests
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  logInfo(`Received ${req.method} ${req.path}`, { 
    requestId: req.id,
    ip: req.ip
  });
  
  // Log when response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    incrementMetric('requests');
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      incrementMetric('successfulRequests');
    } else {
      incrementMetric('failedRequests');
    }
    
    logInfo(`Completed ${req.method} ${req.path}: ${res.statusCode} in ${duration}ms`, {
      requestId: req.id,
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
});

// Apply rate limiting if enabled
if (process.env.ENABLE_RATE_LIMIT !== 'false') {
  app.use(createRateLimiter());
}

// Routes
app.post('/v1/messages', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const result = await optimizedCompletion(req.body);
    const processingTime = Date.now() - startTime;
    
    // Record metrics
    incrementMetric('totalProcessingTime', processingTime);
    if (result._mcp_metadata?.context_optimized) {
      incrementMetric('optimizedContexts');
    }
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/v1/token-count', async (req, res, next) => {
  try {
    const { text, model } = req.query;
    if (!text) {
      return res.status(400).json({
        error: {
          type: 'invalid_request_error',
          message: 'Missing required parameter: text'
        }
      });
    }
    
    const count = await tokenCount(text, model);
    incrementMetric('tokensCounted');
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.status(200).json(getMetrics());
});

// Reset metrics endpoint (admin only)
app.post('/metrics/reset', (req, res) => {
  // In a production environment, add authentication here
  resetMetrics();
  res.status(200).json({ message: 'Metrics reset successfully' });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  // Check Redis connection
  let redisStatus = 'ok';
  try {
    await redisClient.ping();
  } catch (error) {
    redisStatus = 'error';
  }
  
  res.status(200).json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    redis: redisStatus,
    uptime: process.uptime()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(port, () => {
  logInfo(`MCP server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  logInfo('Shutting down server...');
  
  // Close server
  server.close(() => {
    logInfo('Express server closed');
  });
  
  // Close Redis connection
  try {
    await closeRedisConnection();
    logInfo('Redis connection closed');
  } catch (error) {
    logError('Error closing Redis connection', error);
  }
  
  // Exit process
  process.exit(0);
}
