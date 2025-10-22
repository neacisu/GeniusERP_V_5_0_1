/**
 * Payment Methods Utility
 * 
 * Utilities for working with payment methods and gateways.
 */

/**
 * Payment method type
 */
export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'bank_transfer'
  | 'cash_on_delivery'
  | 'stripe'
  | 'other';

/**
 * Payment gateway type
 */
export type PaymentGateway = 
  | 'stripe'
  | 'paypal'
  | 'manual';

/**
 * Map a payment method to its appropriate gateway
 * @param paymentMethod Payment method
 * @returns Payment gateway name
 */
export function mapPaymentMethodToGateway(paymentMethod: PaymentMethod): PaymentGateway {
  switch (paymentMethod) {
    case 'credit_card':
    case 'debit_card':
    case 'stripe':
      return 'stripe';
    case 'paypal':
      return 'paypal';
    case 'bank_transfer':
    case 'cash_on_delivery':
    case 'other':
      return 'manual';
    default:
      // Handle unexpected payment methods as manual
      return 'manual';
  }
}

/**
 * Get display name for a payment method
 * @param paymentMethod Payment method
 * @returns Display name
 */
export function getPaymentMethodDisplayName(paymentMethod: PaymentMethod): string {
  switch (paymentMethod) {
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    case 'paypal':
      return 'PayPal';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'cash_on_delivery':
      return 'Cash on Delivery';
    case 'stripe':
      return 'Stripe';
    case 'other':
      return 'Other Payment Method';
    default:
      return 'Unknown Payment Method';
  }
}

/**
 * Get icon name for a payment method
 * @param paymentMethod Payment method
 * @returns Icon name
 */
export function getPaymentMethodIcon(paymentMethod: PaymentMethod): string {
  switch (paymentMethod) {
    case 'credit_card':
      return 'credit-card';
    case 'debit_card':
      return 'credit-card';
    case 'paypal':
      return 'paypal';
    case 'bank_transfer':
      return 'building-bank';
    case 'cash_on_delivery':
      return 'banknote';
    case 'stripe':
      return 'credit-card';
    case 'other':
      return 'credit-card';
    default:
      return 'help-circle';
  }
}

/**
 * Get available payment methods
 * @returns Array of payment methods
 */
export function getAvailablePaymentMethods(): PaymentMethod[] {
  return [
    'credit_card',
    'debit_card',
    'paypal',
    'bank_transfer',
    'cash_on_delivery'
  ];
}

/**
 * Check if a payment method is supported
 * @param paymentMethod Payment method to check
 * @returns Boolean indicating if method is supported
 */
export function isPaymentMethodSupported(paymentMethod: string): boolean {
  return getAvailablePaymentMethods().includes(paymentMethod as PaymentMethod);
}

/**
 * Get payment method details
 * @param paymentMethod Payment method
 * @returns Payment method details
 */
export function getPaymentMethodDetails(paymentMethod: PaymentMethod) {
  return {
    id: paymentMethod,
    name: getPaymentMethodDisplayName(paymentMethod),
    icon: getPaymentMethodIcon(paymentMethod),
    gateway: mapPaymentMethodToGateway(paymentMethod)
  };
}