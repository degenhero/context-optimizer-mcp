# Context Optimizer MCP

An MCP (Model Context Protocol) server that uses Redis and in-memory caching to optimize and extend context windows for large chat histories.

## Features

- **Dual-Layer Caching**: Combines fast in-memory LRU cache with persistent Redis storage
- **Smart Context Management**: Automatically summarizes older messages to maintain context within token limits
- **Rate Limiting**: Redis-based rate limiting with burst protection
- **API Compatibility**: Drop-in replacement for Anthropic API with enhanced context handling
- **Metrics Collection**: Built-in performance monitoring and logging

## How It Works

This MCP server acts as a middleware between your application and LLM providers (currently supporting Anthropic's Claude models). It intelligently manages conversation context through these strategies:

1. **Context Window Optimization**: When conversations approach the model's token limit, older messages are automatically summarized while preserving key information.

2. **Efficient Caching**: 
   - In-memory LRU cache for frequently accessed conversation summaries
   - Redis for persistent, distributed storage of conversation history and summaries

3. **Transparent Processing**: The server handles all context management automatically while maintaining compatibility with the standard API.

## Getting Started

### Prerequisites

- Node.js 18+
- Redis server (local or remote)
- Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/context-optimizer-mcp.git
cd context-optimizer-mcp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

### Configuration

Configure the server by editing the `.env` file:

```
# Server configuration
PORT=3000

# Anthropic API key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Caching settings
IN_MEMORY_CACHE_MAX_SIZE=1000
REDIS_CACHE_TTL=86400  # 24 hours in seconds

# Model settings
DEFAULT_MODEL=claude-3-opus-20240229
DEFAULT_MAX_TOKENS=4096
```

## API Usage

The server exposes a compatible API endpoint that works like the standard Claude API with additional context optimization features:

```javascript
// Example client usage
const response = await fetch('http://localhost:3000/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-3-opus-20240229',
    messages: [
      { role: 'user', content: 'Hello!' },
      { role: 'assistant', content: 'How can I help you today?' },
      { role: 'user', content: 'Tell me about context management.' }
    ],
    max_tokens: 1000,
    // Optional MCP-specific parameters:
    conversation_id: 'unique-conversation-id', // For context tracking
    context_optimization: true, // Enable/disable optimization
  }),
});

const result = await response.json();
```

### Additional Endpoints

- `GET /v1/token-count?text=your_text&model=model_name`: Count tokens in a text string
- `GET /health`: Server health check

## Advanced Features

### Context Summarization

When a conversation exceeds 80% of the model's token limit, the server automatically summarizes older messages. This summarization is cached for future use.

### Conversation Continuity

By providing a consistent `conversation_id` in requests, the server can maintain context across multiple API calls, even if individual requests would exceed token limits.

## Performance Considerations

- In-memory cache provides fastest access for active conversations
- Redis enables persistence and sharing across server instances
- Summarization operations add some latency to requests that exceed token thresholds

## License

MIT
