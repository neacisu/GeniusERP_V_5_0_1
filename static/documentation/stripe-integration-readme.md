# Stripe Payment Integration

This document outlines the implementation of the Stripe payment integration in our application.

## Overview

The payment processing system integrates directly with the Stripe API using the official Stripe SDK for Node.js. The implementation follows a modular approach that separates concerns across multiple components:

- `PaymentService`: Main service that handles payment processing logic
- `StripeClient`: Client for Stripe API communication 
- `ECommerceController`: Controller with API endpoints for payment processing
- Support utilities for payment methods mapping and configuration

## Architecture

The payment integration follows this flow:

1. Client makes a request to the `/api/ecommerce/payment` endpoint
2. `ECommerceController` validates the request and passes it to `PaymentService`
3. `PaymentService` determines the payment gateway based on the payment method
4. For Stripe payments:
   - A `StripeClient` instance is created with the appropriate configuration
   - The payment is processed through Stripe's API
   - The payment status is returned to the client
5. Based on the payment status, the system updates order and transaction records

## Configuration

Stripe integration relies on two environment variables:

- `STRIPE_SECRET_KEY`: Your Stripe API Secret Key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe Publishable Key (for client-side integration)

These keys can be configured:
1. As environment variables
2. Through the integration management UI (stored in the database)

## API Endpoints

### Direct Payment Processing

```
POST /api/ecommerce/payment
```

**Request:**
```json
{
  "amount": 99.99,
  "currency": "usd",
  "paymentMethod": "credit_card",
  "paymentMethodId": "pm_123456789",
  "customerId": "cus_123456789",
  "description": "Payment for order #12345",
  "capture": true,
  "receiptEmail": "customer@example.com",
  "metadata": {
    "orderId": "order_123456789",
    "other_data": "value"
  }
}
```

**Response (successful):**
```json
{
  "success": true,
  "status": "success",
  "data": {
    "id": "pi_3RAghNFJmIrxR9QO0vCZ0Ox3",
    "clientSecret": "pi_3RAghNFJmIrxR9QO0vCZ0Ox3_secret_...",
    "amount": 9999,
    "currency": "usd",
    "status": "succeeded",
    "createdAt": 1743897869,
    "metadata": { ... }
  },
  "message": "Payment processed successfully",
  "timestamp": "2025-04-06T00:04:29.880Z"
}
```

**Response (pending):**
```json
{
  "success": false,
  "status": "pending",
  "data": {
    "id": "pi_3RAghNFJmIrxR9QO0vCZ0Ox3",
    "clientSecret": "pi_3RAghNFJmIrxR9QO0vCZ0Ox3_secret_...",
    "amount": 9999,
    "currency": "usd",
    "status": "requires_payment_method",
    "createdAt": 1743897869,
    "metadata": { ... }
  },
  "message": "Payment processing requires further action",
  "timestamp": "2025-04-06T00:04:29.880Z"
}
```

### Checkout Integration

The system also supports checkout integration through these endpoints:

```
POST /api/ecommerce/checkout/cart/:cartId
POST /api/ecommerce/checkout/direct
```

These endpoints handle the entire checkout process, including:
1. Order creation
2. Transaction recording
3. Payment processing 
4. Order status updates

## Testing the Integration

Several test scripts are provided to validate the Stripe integration:

1. `test-stripe-payment.js`: Tests basic payment processing
2. `live-test-checkout.js`: Simulates a complete checkout flow
3. `test-stripe-integration.js`: Tests the StripeClient in isolation

To run these tests:

```bash
node test-stripe-payment.js
node live-test-checkout.js
```

## Client-Side Integration

To integrate with the front-end, use the Stripe Elements library or Stripe Checkout:

1. Obtain the `clientSecret` from the payment API response
2. Use Stripe Elements to collect payment information
3. Confirm the payment using `stripe.confirmCardPayment(clientSecret, {...})`

### Example Client Integration

```javascript
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with your publishable key
const stripe = await loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);

// Create payment intent on your server
const response = await fetch('/api/ecommerce/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 99.99, currency: 'usd', ... })
});

const { data } = await response.json();
const { clientSecret } = data;

// Use Stripe Elements to collect payment details
const elements = stripe.elements();
const card = elements.create('card');
card.mount('#card-element');

// Handle form submission
const form = document.getElementById('payment-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  // Confirm the payment
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: card,
      billing_details: { name: 'Customer Name' }
    }
  });
  
  if (result.error) {
    // Show error to customer
    console.error(result.error.message);
  } else {
    // Payment succeeded
    if (result.paymentIntent.status === 'succeeded') {
      console.log('Payment successful!');
    }
  }
});
```

## Webhook Integration

For a complete implementation, Stripe webhooks should be integrated to handle asynchronous payment events:

1. Set up a webhook endpoint in your application (e.g., `/api/ecommerce/webhooks/stripe`)
2. Register this endpoint URL in your Stripe Dashboard
3. Configure the webhook to listen for events like:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`

Stripe will send event notifications to your webhook endpoint, which can update order statuses and trigger other actions based on payment results.

## Future Enhancements

1. Implement full Stripe Checkout flow with customizable UI
2. Add support for saved payment methods and customer management
3. Integrate Stripe Connect for marketplace payments
4. Add support for subscription billing
5. Implement detailed transaction reporting and analytics