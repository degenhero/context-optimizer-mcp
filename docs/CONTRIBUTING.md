# Contributing to Context Optimizer MCP

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Redis (for local development)
- An Anthropic API key

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/context-optimizer-mcp.git
   cd context-optimizer-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start Redis (if not already running):
   ```bash
   # Using Docker
   docker run -p 6379:6379 redis:7-alpine
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

2. Make your changes and test thoroughly

3. Run linting and tests:
   ```bash
   npm run lint
   npm test
   ```

4. Commit your changes with descriptive commit messages

5. Push your branch and create a pull request

## Code Structure

- `index.js` - Main entry point
- `src/` - Core implementation
  - `completion.js` - Completion handling
  - `tokenizer.js` - Token counting
  - `contextManager.js` - Context optimization
  - `caching/` - Caching implementations
  - `middleware/` - Express middleware
  - `utils/` - Utility functions
- `scripts/` - Helper scripts
- `docs/` - Documentation

## Coding Standards

- Use ES modules (import/export) syntax
- Format code with Prettier
- Include JSDoc comments for functions and classes
- Write meaningful commit messages

## Testing

When adding new features or fixing bugs, please include tests to verify your changes. The project uses a simple testing approach:

1. Run the test script to simulate a conversation with increasing context size:
   ```bash
   node scripts/test-context.js
   ```

2. Verify that the context optimization is working correctly by observing the metadata

## Documentation

Please update documentation when adding or changing features:

- Update README.md with user-facing changes
- Update ARCHITECTURE.md with architecture changes
- Add code comments for complex logic

## Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable
2. Update the version number in package.json following semantic versioning
3. The PR will be merged once it receives approval from a maintainer

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.
