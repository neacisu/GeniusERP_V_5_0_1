/**
 * Checkout Service
 * 
 * This service handles the checkout process, including creating orders,
 * processing payments, and integrating with payment gateways.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../common/logger';
import { OrdersService } from './orders.service';
import { TransactionsService } from './transactions.service';
import { CartService } from './cart.service';
import { CartStatus, PaymentStatus } from '../../../../shared/schema/ecommerce.schema';

// Create a logger
const logger = new Logger('CheckoutService');

export class CheckoutService {
  private db: PostgresJsDatabase;
  private ordersService: OrdersService;
  private transactionsService: TransactionsService;
  private cartService: CartService;

  constructor(
    db: PostgresJsDatabase,
    ordersService: OrdersService,
    transactionsService: TransactionsService,
    cartService: CartService
  ) {
    this.db = db;
    this.ordersService = ordersService;
    this.transactionsService = transactionsService;
    this.cartService = cartService;
    logger.info('CheckoutService initialized');
  }

  /**
   * Process a checkout from a cart
   * 
   * @param cartId Cart ID
   * @param userId User ID
   * @param companyId Company ID
   * @param paymentMethod Payment method
   * @param shippingAddress Shipping address
   * @param billingAddress Billing address
   * @param additionalDetails Additional checkout details
   * @returns The created order and transaction
   */
  async processCheckout(
    cartId: string,
    userId: string,
    companyId: string,
    paymentMethod: string,
    shippingAddress: Record<string, any>,
    billingAddress: Record<string, any>,
    additionalDetails: Record<string, any> = {}
  ) {
    try {
      // Get cart with items
      const cart = await this.cartService.getCartWithItems(cartId);
      
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      if (cart.items.length === 0) {
        throw new Error('Cart is empty');
      }
      
      // Create order from cart
      const orderData = {
        userId,
        companyId,
        orderNumber: this.generateOrderNumber(),
        orderDate: new Date(),
        status: 'pending',
        totalAmount: cart.total,
        taxAmount: cart.taxAmount,
        discountAmount: cart.discountAmount,
        shippingAmount: "0", // Would be calculated based on shipping options
        currencyCode: cart.currencyCode,
        shippingAddress,
        billingAddress,
        paymentMethod,
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          metadata: item.metadata
        })),
        notes: additionalDetails.notes || '',
        metadata: {
          ...additionalDetails,
          cartId
        }
      };
      
      const order = await this.ordersService.createOrder(orderData);
      
      // Process payment
      const transactionData = {
        orderId: order.id,
        userId,
        companyId,
        transactionDate: new Date(),
        amount: cart.total,
        currency: cart.currencyCode,
        status: PaymentStatus.PENDING,
        paymentMethod,
        paymentGateway: this.getPaymentGatewayForMethod(paymentMethod),
        gatewayTransactionId: uuidv4(), // Would be provided by the payment gateway
        metadata: {
          ...additionalDetails,
          cartId,
          orderNumber: order.orderNumber
        }
      };
      
      const transaction = await this.transactionsService.createTransaction(transactionData);
      
      // Mark cart as completed
      await this.cartService.setCartStatus(cartId, CartStatus.COMPLETED);
      
      // Handle transaction authorization with payment gateway
      // This would typically involve calling an external payment processor
      // For now, we'll simulate a successful payment
      const processedTransaction = await this.authorizePayment(transaction.id);
      
      // Update order status based on payment
      let updatedOrder = order;
      
      if (processedTransaction.status === PaymentStatus.COMPLETED) {
        updatedOrder = await this.ordersService.updateOrderStatus(order.id, "confirmed", companyId);
      } else if (processedTransaction.status === PaymentStatus.FAILED) {
        updatedOrder = await this.ordersService.updateOrderStatus(order.id, "payment_failed", companyId);
      }
      
      return {
        order: updatedOrder,
        transaction: processedTransaction
      };
    } catch (error) {
      logger.error('Failed to process checkout', error);
      throw new Error(`Failed to process checkout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process a direct checkout (without a cart)
   * 
   * @param userId User ID
   * @param companyId Company ID
   * @param items Order items
   * @param paymentMethod Payment method
   * @param shippingAddress Shipping address
   * @param billingAddress Billing address
   * @param additionalDetails Additional checkout details
   * @returns The created order and transaction
   */
  async processDirectCheckout(
    userId: string,
    companyId: string,
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      metadata?: Record<string, any>;
    }>,
    paymentMethod: string,
    shippingAddress: Record<string, any>,
    billingAddress: Record<string, any>,
    additionalDetails: Record<string, any> = {}
  ) {
    try {
      // Calculate totals from items
      const itemsWithTotals = items.map(item => ({
        ...item,
        totalPrice: String(item.quantity * item.unitPrice),
        unitPrice: String(item.unitPrice),
        metadata: item.metadata || {}
      }));
      
      const subtotal = itemsWithTotals.reduce((sum, item) => sum + Number(item.totalPrice), 0);
      
      // Apply tax, discounts, etc. based on business rules
      // For now, using simple values
      const taxAmount = 0;
      const discountAmount = 0;
      const total = subtotal + taxAmount - discountAmount;
      
      // Create order
      const orderData = {
        userId,
        companyId,
        orderNumber: this.generateOrderNumber(),
        orderDate: new Date(),
        status: 'pending',
        totalAmount: String(total),
        taxAmount: String(taxAmount),
        discountAmount: String(discountAmount),
        shippingAmount: "0",
        currencyCode: 'RON', // Default to Romanian currency
        shippingAddress,
        billingAddress,
        paymentMethod,
        items: itemsWithTotals,
        notes: additionalDetails.notes || '',
        metadata: additionalDetails
      };
      
      const order = await this.ordersService.createOrder(orderData);
      
      // Process payment
      const transactionData = {
        orderId: order.id,
        userId,
        companyId,
        transactionDate: new Date(),
        amount: String(total),
        currency: 'RON',
        status: PaymentStatus.PENDING,
        paymentMethod,
        paymentGateway: this.getPaymentGatewayForMethod(paymentMethod),
        gatewayTransactionId: uuidv4(), // Would be provided by the payment gateway
        metadata: {
          ...additionalDetails,
          orderNumber: order.orderNumber
        }
      };
      
      const transaction = await this.transactionsService.createTransaction(transactionData);
      
      // Handle transaction authorization with payment gateway
      const processedTransaction = await this.authorizePayment(transaction.id);
      
      // Update order status based on payment
      let updatedOrder = order;
      
      if (processedTransaction.status === PaymentStatus.COMPLETED) {
        updatedOrder = await this.ordersService.updateOrderStatus(order.id, "confirmed", companyId);
      } else if (processedTransaction.status === PaymentStatus.FAILED) {
        updatedOrder = await this.ordersService.updateOrderStatus(order.id, "payment_failed", companyId);
      }
      
      return {
        order: updatedOrder,
        transaction: processedTransaction
      };
    } catch (error) {
      logger.error('Failed to process direct checkout', error);
      throw new Error(`Failed to process direct checkout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Authorize a payment with the payment gateway
   * 
   * @param transactionId Transaction ID
   * @returns The processed transaction
   */
  private async authorizePayment(transactionId: string) {
    try {
      logger.info(`Authorizing payment for transaction ${transactionId}`);
      
      // Retrieve transaction
      const transaction = await this.transactionsService.getTransactionById(transactionId, "all");
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // In a real implementation, this would call to an external payment gateway
      // For now, simulate payment processing with a random success/failure
      const isSuccessful = Math.random() > 0.1; // 90% success rate for testing
      
      if (isSuccessful) {
        // Update transaction status to completed
        const updatedTransaction = await this.transactionsService.updateTransactionStatus(
          transactionId,
          PaymentStatus.COMPLETED,
          String(transaction.amount),
          {
            authorizationCode: this.generateAuthorizationCode(),
            processingDetails: {
              processingDate: new Date(),
              processorResponseCode: '00', // Common success code
              processorResponseMessage: 'Approved'
            }
          }
        );
        
        logger.info(`Payment authorized successfully for transaction ${transactionId}`);
        return updatedTransaction;
      } else {
        // Update transaction status to failed
        const updatedTransaction = await this.transactionsService.updateTransactionStatus(
          transactionId,
          PaymentStatus.FAILED,
          String(transaction.amount),
          {
            processingDetails: {
              processingDate: new Date(),
              processorResponseCode: '05', // Common decline code
              processorResponseMessage: 'Do not honor'
            }
          }
        );
        
        logger.warn(`Payment authorization failed for transaction ${transactionId}`);
        return updatedTransaction;
      }
    } catch (error) {
      logger.error(`Error authorizing payment for transaction ${transactionId}`, error);
      
      // Update transaction to failed status
      const updatedTransaction = await this.transactionsService.updateTransactionStatus(
        transactionId,
        PaymentStatus.FAILED,
        "0",
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      
      return updatedTransaction;
    }
  }

  /**
   * Generate a unique order number
   * 
   * @returns Order number
   */
  private generateOrderNumber(): string {
    const timestamp = new Date().getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Generate an authorization code
   * 
   * @returns Authorization code
   */
  private generateAuthorizationCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Determine payment gateway based on payment method
   * 
   * @param paymentMethod Payment method
   * @returns Payment gateway name
   */
  private getPaymentGatewayForMethod(paymentMethod: string): string {
    // Map payment methods to gateways
    const gatewayMap: Record<string, string> = {
      'credit_card': 'stripe',
      'debit_card': 'stripe',
      'bank_transfer': 'manual',
      'cash': 'manual',
      'check': 'manual',
      'mobile_payment': 'mobilpay',
      'paypal': 'paypal'
    };
    
    return gatewayMap[paymentMethod.toLowerCase()] || 'manual';
  }
}