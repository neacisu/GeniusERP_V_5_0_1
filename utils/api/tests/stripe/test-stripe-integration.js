/**
 * Test Stripe Integration Script
 * 
 * This script tests the Stripe integration by creating a payment intent
 * using environment variables for the API key.
 */

import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

/**
 * Run Stripe integration test
 */
async function testStripeIntegration() {
  console.log('Testing Stripe integration with environment variables...');
  
  try {
    // Get Stripe API key from environment variable
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    
    console.log('Initializing Stripe client with API key...');
    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
    
    // Test the connection by getting account info
    console.log('Testing connection to Stripe API...');
    const account = await stripe.accounts.retrieve();
    console.log('Successfully connected to Stripe account:', account.id);
    
    // Create a test payment intent
    console.log('Creating a test payment intent for 1000 RON...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100000, // 1000.00 RON in smallest currency unit (bani)
      currency: 'ron',
      description: 'Test payment intent',
      metadata: {
        integration_test: 'true',
        test_id: uuidv4()
      }
    });
    
    console.log('Successfully created payment intent!');
    console.log('Payment Intent ID:', paymentIntent.id);
    console.log('Payment Intent Status:', paymentIntent.status);
    console.log('Payment Intent Client Secret:', paymentIntent.client_secret);
    
    // Test retrieving the payment intent
    console.log('\nRetrieving payment intent...');
    const retrievedIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
    console.log('Successfully retrieved payment intent with ID:', retrievedIntent.id);
    
    // Cancel the test payment intent to avoid leaving test data
    console.log('\nCanceling test payment intent...');
    const canceledIntent = await stripe.paymentIntents.cancel(paymentIntent.id);
    console.log('Successfully canceled payment intent. Final status:', canceledIntent.status);
    
    return {
      success: true,
      accountId: account.id,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Error testing Stripe integration:');
    console.error(error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('Authentication error: Your Stripe API key may be invalid.');
    } else if (error.type === 'StripeConnectionError') {
      console.error('Connection error: Could not connect to Stripe API.');
    }
    
    throw error;
  }
}

// Run the test
testStripeIntegration()
  .then(result => {
    console.log('\nStripe integration test completed successfully!');
    console.log('Results:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\nStripe integration test failed!', error);
    process.exit(1);
  });