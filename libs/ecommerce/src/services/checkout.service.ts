/**
 * Checkout Service
 * 
 * This service handles the checkout process, including creating orders,
 * processing payments, and integrating with payment gateways.
 */

import { v4 as uuidv4 } from 'uuid';
import { createModuleLogger } from "@common/logger/loki-logger";
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { OrdersService } from './orders.service';
import { TransactionsService } from './transactions.service';
import { CartService } from './cart.service';
import { PaymentService, PaymentResultStatus } from './payment.service';
import { CartStatus, PaymentStatus, OrderStatus, TransactionType, PaymentMethod } from '../../../../shared/schema/ecommerce.schema';
import { mapPaymentMethodToGateway } from '../utils/payment-methods.util';

// Create a logger
const logger = createModuleLogger('CheckoutService');

export class CheckoutService {
  private db: DrizzleService;
  private ordersService: OrdersService;
  private transactionsService: TransactionsService;
  private cartService: CartService;
  private paymentService: PaymentService;

  constructor(
    drizzleService: DrizzleService,
    ordersService: OrdersService,
    transactionsService: TransactionsService,
    cartService: CartService,
    paymentService: PaymentService
  ) {
    this.db = drizzleService;
    this.ordersService = ordersService;
    this.transactionsService = transactionsService;
    this.cartService = cartService;
    this.paymentService = paymentService;
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
        status: OrderStatus.PENDING,
        totalAmount: cart.total,
        taxAmount: cart.taxAmount,
        discountAmount: cart.discountAmount,
        shippingAmount: "0", // Would be calculated based on shipping options
        currencyCode: cart.currencyCode,
        shippingAddress,
        billingAddress,
        paymentMethod,
        items: cart.items.map((item: any) => ({
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
        companyId,
        transactionType: 'payment' as const,
        transactionDate: new Date(),
        amount: cart.total,
        currency: cart.currencyCode,
        status: PaymentStatus.PENDING,
        paymentMethod,
        gatewayName: this.getPaymentGatewayForMethod(paymentMethod),
        transactionId: uuidv4(), // Would be provided by the payment gateway
        metadata: {
          ...additionalDetails,
          cartId,
          orderNumber: order.orderNumber
        },
        createdBy: userId
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
        updatedOrder = await this.ordersService.updateOrderStatus(order.id, OrderStatus.COMPLETED, companyId);
      } else if (processedTransaction.status === PaymentStatus.FAILED) {
        updatedOrder = await this.ordersService.updateOrderStatus(order.id, OrderStatus.FAILED, companyId);
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
        status: OrderStatus.PENDING,
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
        companyId,
        transactionType: 'payment' as const,
        transactionDate: new Date(),
        amount: String(total),
        currency: 'RON',
        status: PaymentStatus.PENDING,
        paymentMethod,
        gatewayName: this.getPaymentGatewayForMethod(paymentMethod),
        transactionId: uuidv4(), // Would be provided by the payment gateway
        metadata: {
          ...additionalDetails,
          orderNumber: order.orderNumber
        },
        createdBy: userId
      };
      
      const transaction = await this.transactionsService.createTransaction(transactionData);
      
      // Handle transaction authorization with payment gateway
      const processedTransaction = await this.authorizePayment(transaction.id);
      
      // Update order status based on payment
      let updatedOrder = order;
      
      if (processedTransaction.status === PaymentStatus.COMPLETED) {
        updatedOrder = await this.ordersService.updateOrderStatus(order.id, OrderStatus.COMPLETED, companyId);
      } else if (processedTransaction.status === PaymentStatus.FAILED) {
        updatedOrder = await this.ordersService.updateOrderStatus(order.id, OrderStatus.FAILED, companyId);
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

      // Get order details for payment description
      const order = await this.ordersService.getOrderById(transaction.orderId, transaction.companyId);
      
      if (!order) {
        throw new Error(`Order not found with ID: ${transaction.orderId}`);
      }
      
      // Process the payment through the PaymentService
      const paymentResponse = await this.paymentService.processPayment(
        transaction.companyId,
        transaction.createdBy || '0',
        (transaction.paymentMethod as PaymentMethod) || PaymentMethod.CREDIT_CARD,
        Number(transaction.amount),
        transaction.currency || 'RON',
        {
          description: `Payment for order ${order.orderNumber || transaction.orderId}`,
          metadata: {
            transactionId: transaction.id,
            orderId: transaction.orderId,
            customerId: order.customerId || undefined,
            orderNumber: order.orderNumber,
            ...transaction.metadata
          }
        }
      );
      
      // Map PaymentService status to our schema PaymentStatus
      const mappedStatus = this.mapPaymentServiceStatus(paymentResponse.status);

      // Extract payment intent data from response
      const paymentIntentId = paymentResponse.data?.id || '';
      const clientSecret = paymentResponse.data?.clientSecret || '';
      const receiptUrl = paymentResponse.data?.receiptUrl || '';
      
      // Update the transaction with the payment response details
      const updatedTransaction = await this.transactionsService.updateTransactionStatus(
        transactionId,
        mappedStatus,
        transaction.amount,
        {
          authorizationCode: this.generateAuthorizationCode(),
          gatewayTransactionId: paymentIntentId,
          clientSecret: clientSecret,
          processingDetails: {
            processingDate: new Date(),
            processorResponseCode: mappedStatus === PaymentStatus.COMPLETED ? '00' : '05',
            processorResponseMessage: paymentResponse.error || 'Payment processed',
            paymentIntentId: paymentIntentId,
            receiptUrl: receiptUrl
          }
        }
      );
      
      logger.info(`Payment processed for transaction ${transactionId}`, { 
        status: mappedStatus, 
        paymentIntentId: paymentIntentId 
      });
      
      return updatedTransaction;
    } catch (error) {
      logger.error(`Error authorizing payment for transaction ${transactionId}`, error);
      
      // Update transaction to failed status
      const updatedTransaction = await this.transactionsService.updateTransactionStatus(
        transactionId,
        PaymentStatus.FAILED,
        "0",
        {
          error: error instanceof Error ? error.message : String(error),
          processingDetails: {
            processingDate: new Date(),
            processorResponseCode: '05',
            processorResponseMessage: 'Payment processing error'
          }
        }
      );
      
      return updatedTransaction;
    }
  }
  
  /**
   * Map PaymentService status to schema PaymentStatus
   * 
   * @param resultStatus Status from PaymentService
   * @returns Schema-compatible PaymentStatus
   */
  private mapPaymentServiceStatus(resultStatus: PaymentResultStatus): PaymentStatus {
    // Create a mapping to ensure compatibility
    const statusMap = {
      [PaymentResultStatus.SUCCESS]: PaymentStatus.COMPLETED,
      [PaymentResultStatus.PENDING]: PaymentStatus.PENDING,
      [PaymentResultStatus.FAILED]: PaymentStatus.FAILED,
      [PaymentResultStatus.CANCELED]: PaymentStatus.FAILED,
      [PaymentResultStatus.REQUIRES_ACTION]: PaymentStatus.PENDING
    };
    
    return statusMap[resultStatus] || PaymentStatus.PENDING;
  }
  
  // Legacy payment processing methods have been replaced by the new PaymentService

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
    return mapPaymentMethodToGateway(paymentMethod as PaymentMethod);
  }
}