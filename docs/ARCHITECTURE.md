# Context Optimizer MCP: Architecture

## Overview

This document outlines the architecture of the Context Optimizer MCP server, explaining how the various components work together to provide efficient context management for large language model conversations.

## System Architecture

```
┌────────────────┐     ┌─────────────────────────────────────────┐     ┌────────────────┐
│                │     │               MCP Server                │     │                │
│                │     │  ┌─────────────┐      ┌─────────────┐  │     │                │
│   Client       │────▶│  │ API Layer   │─────▶│ Context     │  │────▶│  LLM Provider  │
│   Application  │     │  │             │◀─────│ Manager     │  │     │  (Anthropic)   │
│                │◀────│  └─────────────┘      └──────┬──────┘  │◀────│                │
│                │     │                              │         │     │                │
└────────────────┘     │                         ┌───▼────┐    │     └────────────────┘
                       │                         │        │    │
                       │  ┌─────────────┐       │ Cache  │    │
                       │  │ In-Memory   │◀─────▶│ Layer  │    │
                       │  │ Cache (LRU) │       │        │    │
                       │  └─────────────┘       └───┬────┘    │
                       │                            │         │
                       │                      ┌────▼─────┐   │
                       │                      │  Redis    │   │
                       │                      │  Cache    │   │
                       │                      └──────────┘   │
                       └─────────────────────────────────────┘
```

## Component Descriptions

### 1. API Layer

The API layer handles incoming requests from client applications, providing a compatible interface with standard LLM APIs. It processes requests, applies rate limiting, and routes requests to the appropriate handlers.

**Key files:**
- `index.js` - Main server file
- `src/middleware/rateLimiter.js` - Rate limiting implementation
- `src/middleware/errorHandler.js` - Error handling middleware

### 2. Context Manager

The Context Manager is the core component responsible for optimizing conversation contexts to fit within token limits. It analyzes messages, determines when summarization is needed, and manages the caching of conversation summaries.

**Key files:**
- `src/contextManager.js` - Main context management logic
- `src/tokenizer.js` - Token counting utilities

### 3. Cache Layer

The cache layer provides a dual-layer caching system that combines fast in-memory access with persistent Redis storage. This enables efficient retrieval of conversation summaries across requests and server instances.

**Key files:**
- `src/caching/inMemoryCache.js` - LRU-based in-memory cache
- `src/caching/redisCache.js` - Redis-based persistent cache

### 4. Completion Handler

The completion handler coordinates the optimization process and makes requests to the LLM provider. It integrates the context manager with the external API.

**Key files:**
- `src/completion.js` - Handles completions with context optimization

## Data Flow

1. **Client Request:**
   - Client sends a request to the MCP server with messages and optionally a conversation ID

2. **Request Processing:**
   - The server receives the request, applies rate limiting, and routes it to the completion handler

3. **Token Counting:**
   - The context manager counts tokens in the current messages

4. **Context Optimization:**
   - If the token count exceeds the threshold:
     - Check for cached summaries
     - Create a new summary if none exists
     - Optimize the context by combining summaries with recent messages

5. **LLM Request:**
   - The optimized context is sent to the LLM provider

6. **Response Handling:**
   - The LLM response is received and sent back to the client
   - Metadata about the optimization is included

## Caching Strategy

The system employs a two-level caching strategy:

1. **In-Memory Cache:**
   - Uses LRU (Least Recently Used) policy
   - Fast access for frequently used conversations
   - Limited by server memory

2. **Redis Cache:**
   - Persistent storage with configurable TTL
   - Shared across multiple server instances
   - Survives server restarts

This approach balances performance with durability, ensuring efficient access to conversation summaries while maintaining persistence.

## Scaling Considerations

- The architecture supports horizontal scaling by using Redis as a shared cache
- Rate limiting prevents abuse and ensures fair resource allocation
- Graceful shutdown handling ensures clean termination
- Docker and Docker Compose support simplifies deployment

## Future Extensions

- Support for additional LLM providers
- More sophisticated summarization strategies
- Enhanced metrics and monitoring
- Support for vector-based retrieval of context
- Client libraries for common programming languages
