import Anthropic from '@anthropic-ai/sdk';
import { ContextManager } from './contextManager.js';
import crypto from 'crypto';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Process completion with context optimization
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Completion response
 */
export async function optimizedCompletion(params) {
  try {
    // Extract parameters
    const {
      model = process.env.DEFAULT_MODEL || 'claude-3-opus-20240229',
      messages,
      max_tokens = parseInt(process.env.DEFAULT_MAX_TOKENS) || 4096,
      temperature,
      top_p,
      top_k,
      stop_sequences,
      conversation_id,
      stream = false,
      context_optimization = true
    } = params;
    
    // Skip optimization if disabled
    if (!context_optimization) {
      return directCompletion(params);
    }
    
    // Create context manager with appropriate settings
    const contextManager = new ContextManager({
      model,
      maxTokens: max_tokens,
      useInMemoryCache: true,
      useRedisCache: true,
    });
    
    // Generate a conversation ID if not provided
    const conversationId = conversation_id || generateConversationId();
    
    // Optimize the context to fit within token limits
    const optimizedMessages = await contextManager.optimizeContext(messages, conversationId);
    
    // Prepare completion parameters with optimized messages
    const completionParams = {
      model,
      messages: optimizedMessages,
      max_tokens,
      temperature,
      top_p,
      top_k,
      stop_sequences,
      stream,
    };
    
    // Remove undefined parameters
    Object.keys(completionParams).forEach(key => {
      if (completionParams[key] === undefined) {
        delete completionParams[key];
      }
    });
    
    // Make API call to Anthropic
    const response = await anthropic.messages.create(completionParams);
    
    // Return response with metadata
    return {
      ...response,
      _mcp_metadata: {
        context_optimized: true,
        original_message_count: messages.length,
        optimized_message_count: optimizedMessages.length,
        conversation_id: conversationId,
      },
    };
  } catch (error) {
    console.error('Error in optimized completion:', error);
    throw error;
  }
}

/**
 * Pass through to direct completion without optimization
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Completion response
 */
async function directCompletion(params) {
  // Filter out MCP-specific parameters
  const { conversation_id, context_optimization, ...completionParams } = params;
  
  // Make API call to Anthropic
  const response = await anthropic.messages.create(completionParams);
  
  // Return response with metadata
  return {
    ...response,
    _mcp_metadata: {
      context_optimized: false,
      conversation_id: conversation_id || generateConversationId(),
    },
  };
}

/**
 * Generate a random conversation ID
 * @returns {string} Unique conversation ID
 */
function generateConversationId() {
  return `conv_${crypto.randomUUID()}`;
}
