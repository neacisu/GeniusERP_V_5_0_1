/**
 * Test Stripe Client Script
 * 
 * This script tests the integration with Stripe by making direct calls to the Stripe client.
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';

// Load environment variables
dotenv.config();

async function testStripeClient() {
  try {
    console.log('Testing Stripe integration...');
    
    // Check if Stripe API key is available
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error('❌ Stripe API key not found in environment variables!');
      console.log('Please set the STRIPE_SECRET_KEY environment variable.');
      return false;
    }
    
    console.log('✅ Stripe API key found in environment variables');
    
    // Partially mask the API key for logging
    const maskedKey = stripeKey.substring(0, 7) + '...' + stripeKey.substring(stripeKey.length - 4);
    console.log(`Using Stripe API key: ${maskedKey}`);
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    
    console.log('✅ Stripe client initialized');
    
    // Test connection by retrieving account information
    console.log('Retrieving account information...');
    const account = await stripe.account.retrieve();
    console.log(`✅ Connected to Stripe account: ${account.id}`);
    
    // Test creating a payment intent
    console.log('Creating a test payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'usd',
      payment_method_types: ['card'],
      description: 'Test payment intent from Node.js script',
      metadata: {
        integration_test: true,
        test_date: new Date().toISOString()
      }
    });
    
    console.log(`✅ Payment intent created: ${paymentIntent.id}`);
    console.log(`   Status: ${paymentIntent.status}`);
    console.log(`   Amount: ${paymentIntent.amount} (${paymentIntent.currency})`);
    console.log(`   Client secret (partial): ${paymentIntent.client_secret?.substring(0, 10)}...`);
    
    // Test canceling the payment intent
    console.log('Canceling test payment intent...');
    const canceledIntent = await stripe.paymentIntents.cancel(paymentIntent.id);
    console.log(`✅ Payment intent canceled: ${canceledIntent.id}`);
    console.log(`   Status after cancellation: ${canceledIntent.status}`);
    
    // Test creating a customer
    console.log('Creating a test customer...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User',
      metadata: {
        integration_test: true,
        test_date: new Date().toISOString()
      }
    });
    
    console.log(`✅ Customer created: ${customer.id}`);
    
    // Test deleting the customer
    console.log('Deleting test customer...');
    const deletedCustomer = await stripe.customers.del(customer.id);
    console.log(`✅ Customer deleted: ${deletedCustomer.id}`);
    console.log(`   Deleted: ${deletedCustomer.deleted}`);
    
    console.log('\n✅ All Stripe integration tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error testing Stripe integration:');
    if (error instanceof Stripe.errors.StripeError) {
      console.error(`   Type: ${error.type}`);
      console.error(`   Message: ${error.message}`);
      if (error.type === 'StripeAuthenticationError') {
        console.error('   This is likely due to an invalid API key. Please check your STRIPE_SECRET_KEY environment variable.');
      }
    } else {
      console.error(error);
    }
    return false;
  }
}

// Run the test
testStripeClient()
  .then(success => {
    console.log(`\nTest ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });