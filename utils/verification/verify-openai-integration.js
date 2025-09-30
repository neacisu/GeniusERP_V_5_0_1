/**
 * OpenAI Integration Verification Script
 * 
 * This script tests the OpenAI integration by making a simple completion request
 * and verifying that the OPENAI_API_KEY is properly configured.
 */

import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

async function verifyOpenAiIntegration() {
  console.log('🔍 Verifying OpenAI API integration...');
  
  // Check if the API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Missing OPENAI_API_KEY in environment variables. Please add it to .env file.');
    return false;
  }
  
  console.log(`✅ Found OPENAI_API_KEY: ${maskApiKey(apiKey)}`);
  
  // Check if organization ID is available (optional)
  const organization = process.env.OPENAI_ORGANIZATION;
  if (organization) {
    console.log(`✅ Found OPENAI_ORGANIZATION: ${organization}`);
  } else {
    console.log('ℹ️ OPENAI_ORGANIZATION not found. This is optional, but may be required for enterprise accounts.');
  }
  
  // Initialize the OpenAI client
  let openai;
  if (organization) {
    openai = new OpenAI({
      apiKey,
      organization
    });
  } else {
    openai = new OpenAI({
      apiKey
    });
  }
  
  try {
    console.log('🚀 Making a test request to OpenAI API...');
    
    // Make a simple completion request to verify connectivity
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "OpenAI integration successful!" if you can read this.' }
      ],
      max_tokens: 20
    });
    
    // Extract the response text
    const responseText = completion.choices[0].message.content.trim();
    
    console.log('📝 OpenAI response:', responseText);
    
    if (responseText.includes('successful')) {
      console.log('✅ OpenAI integration verified successfully!');
      return true;
    } else {
      console.log('⚠️ Connected to OpenAI, but unexpected response. Check logs above.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error connecting to OpenAI:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    
    // Provide troubleshooting tips
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Verify your API key is correct and active in the OpenAI dashboard.');
    console.log('2. Check your account balance and usage limits.');
    console.log('3. If using an organization ID, verify it is correct.');
    console.log('4. Check your network connectivity and firewall settings.');
    
    return false;
  }
}

/**
 * Mask API key for security in logs
 */
function maskApiKey(key) {
  if (!key) return 'not provided';
  if (key.length < 10) return '****';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

// Run the verification
verifyOpenAiIntegration()
  .then(success => {
    if (success) {
      console.log('\n🎉 OpenAI integration is working correctly.');
    } else {
      console.log('\n❌ OpenAI integration verification failed.');
    }
  })
  .catch(err => {
    console.error('\n❌ Unexpected error during verification:', err);
  });