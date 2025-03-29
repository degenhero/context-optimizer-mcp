#!/usr/bin/env node

/**
 * Test script for context optimization MCP server
 * 
 * This script demonstrates how the context optimization works by creating
 * an increasingly large context and showing how the server handles it.
 */

import fetch from 'node-fetch';
import readline from 'readline';

// Configuration
const MCP_SERVER = process.env.MCP_SERVER || 'http://localhost:3000';
const MODEL = process.env.MODEL || 'claude-3-opus-20240229';
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '1000');
const CONVERSATION_ID = `test_${Date.now()}`;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initial conversation state
let messages = [];
let turnCount = 0;

async function main() {
  console.log('Context Optimization MCP Test Script');
  console.log('-----------------------------------');
  console.log(`Server: ${MCP_SERVER}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Conversation ID: ${CONVERSATION_ID}`);
  console.log(`Max tokens: ${MAX_TOKENS}`);
  console.log('-----------------------------------');
  console.log('Type your messages. The script will show context optimization in action.');
  console.log('Type "exit" to quit.');
  console.log('-----------------------------------');
  
  // Start conversation loop
  await conversationLoop();
  
  rl.close();
}

async function conversationLoop() {
  while (true) {
    const userInput = await askQuestion('You: ');
    
    if (userInput.toLowerCase() === 'exit') {
      console.log('Exiting test script.');
      break;
    }
    
    // Add user message to conversation
    messages.push({ role: 'user', content: userInput });
    
    try {
      // Get token count for current messages
      const tokenCount = await getTokenCount(messages);
      console.log(`Current context size: ${tokenCount} tokens`);
      
      // Get completion from MCP server
      console.log('Sending request to MCP server...');
      const response = await getCompletion(messages);
      
      // Add assistant response to conversation
      messages.push({ role: 'assistant', content: response.content[0].text });
      
      // Display response and metadata
      console.log(`\nAssistant: ${response.content[0].text}\n`);
      console.log('MCP Metadata:');
      console.log(response._mcp_metadata);
      console.log('-----------------------------------');
      
      turnCount++;
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

async function getCompletion(messages) {
  const response = await fetch(`${MCP_SERVER}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: MAX_TOKENS,
      conversation_id: CONVERSATION_ID,
      context_optimization: true,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
  }
  
  return await response.json();
}

async function getTokenCount(messages) {
  const messagesText = JSON.stringify(messages);
  
  const response = await fetch(`${MCP_SERVER}/v1/token-count?text=${encodeURIComponent(messagesText)}&model=${MODEL}`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token count error: ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.count;
}

function askQuestion(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
