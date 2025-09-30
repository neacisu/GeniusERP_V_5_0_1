/**
 * Check OpenAI API Key Script
 * 
 * This script checks if the OpenAI API key is available in the environment
 * and displays its status. Use this to verify your OpenAI configuration.
 */

import * as dotenv from 'dotenv';
dotenv.config();

function checkOpenAiKey() {
  console.log('=== OpenAI API Key Verification ===');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is not set.');
    console.log('Please add your OpenAI API key to the .env file:');
    console.log('OPENAI_API_KEY=your_api_key_here');
    return false;
  }
  
  console.log(`✅ OPENAI_API_KEY found: ${maskApiKey(apiKey)}`);
  
  const organization = process.env.OPENAI_ORGANIZATION;
  if (organization) {
    console.log(`✅ OPENAI_ORGANIZATION found: ${organization}`);
  } else {
    console.log('ℹ️ OPENAI_ORGANIZATION not found. This is optional unless using an enterprise account.');
  }
  
  return true;
}

function maskApiKey(key: string): string {
  if (!key) return 'not provided';
  if (key.length < 10) return '****';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

// Run the check
const keyAvailable = checkOpenAiKey();
console.log('\nResult:', keyAvailable ? '✅ API key is available' : '❌ API key is missing');