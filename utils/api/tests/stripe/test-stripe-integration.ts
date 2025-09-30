/**
 * Stripe Integration Test Script
 * 
 * This script tests the Stripe integration by creating a payment intent.
 * It uses the Stripe client directly to verify the API keys are working.
 */

import * as dotenv from 'dotenv';
import { StripeClient } from './server/modules/integrations/clients/stripe.client';

// Load environment variables
dotenv.config();

// Check if we have the necessary API keys
const checkEnvironment = (): boolean => {
  console.log('Checking environment variables for Stripe integration...');
  
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  
  if (!stripeSecretKey) {
    console.error('❌ Missing STRIPE_SECRET_KEY environment variable');
    return false;
  }
  
  if (!stripePublishableKey) {
    console.error('❌ Missing STRIPE_PUBLISHABLE_KEY environment variable');
    return false;
  }
  
  console.log('✅ All required Stripe environment variables are present');
  return true;
};

// Test the Stripe integration
const testStripeIntegration = async (): Promise<boolean> => {
  console.log('Starting Stripe integration test...');
  
  try {
    // Create a Stripe client instance
    // Note: Use a test company ID since this is just for testing
    const companyId = 'test-company-123';
    const stripeClient = new StripeClient(companyId);
    
    // Test connection to Stripe API
    console.log('Testing connection to Stripe API...');
    const connectionTest = await stripeClient.testConnection();
    
    if (!connectionTest) {
      console.error('❌ Failed to connect to Stripe API');
      return false;
    }
    
    console.log('✅ Successfully connected to Stripe API');
    
    // Create a payment intent to test the full integration
    console.log('Creating a test payment intent...');
    const paymentIntent = await stripeClient.createPaymentIntent(
      1000, // $10.00
      'usd',
      'Test payment for integration verification',
      { test: 'true', environment: 'development' },
      null, // No customer ID for this test
      null, // No payment method for this test
      'system' // System user ID for audit
    );
    
    if (!paymentIntent || !paymentIntent.id) {
      console.error('❌ Failed to create payment intent');
      console.error(paymentIntent);
      return false;
    }
    
    console.log('✅ Successfully created payment intent');
    console.log('Payment Intent ID:', paymentIntent.id);
    console.log('Amount:', paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
    console.log('Status:', paymentIntent.status);
    
    // Try retrieving the payment intent we just created to verify
    console.log('Retrieving the payment intent...');
    const retrievedIntent = await stripeClient.getPaymentIntent(paymentIntent.id, 'system');
    
    if (!retrievedIntent || retrievedIntent.id !== paymentIntent.id) {
      console.error('❌ Failed to retrieve payment intent');
      return false;
    }
    
    console.log('✅ Successfully retrieved payment intent');
    
    // All tests passed
    console.log('✅ All Stripe integration tests passed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error during Stripe integration test:', error);
    return false;
  }
};

// Main execution function
const main = async (): Promise<void> => {
  console.log('===== Stripe Integration Test =====');
  
  // Check environment variables
  const envCheck = checkEnvironment();
  if (!envCheck) {
    console.error('❌ Environment check failed - unable to proceed with tests');
    process.exit(1);
  }
  
  // Run the integration test
  const testResult = await testStripeIntegration();
  
  if (!testResult) {
    console.error('❌ Stripe integration test failed');
    process.exit(1);
  }
  
  console.log('===== Stripe Integration Test Completed Successfully =====');
};

// Run the main function
main().catch(error => {
  console.error('Unhandled error in Stripe integration test:', error);
  process.exit(1);
});