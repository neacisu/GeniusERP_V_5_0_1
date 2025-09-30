/**
 * Transactions Service
 * 
 * This service handles e-commerce payment transactions including creation,
 * processing, and management of payment records.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';
import { ecommerceTransactions, PaymentStatus } from '../../../../shared/schema/ecommerce.schema';
import { Logger } from '../../../common/logger';

// Create a logger
const logger = new Logger('TransactionsService');

export class TransactionsService {
  private db: DrizzleService;

  constructor(drizzleService: DrizzleService) {
    this.db = drizzleService;
    logger.info('TransactionsService initialized');
  }

  /**
   * Create a new transaction
   * 
   * @param transactionData Transaction data
   * @returns The created transaction
   */
  async createTransaction(transactionData: {
    orderId: string;
    userId: string;
    companyId: string;
    transactionDate: Date;
    amount: string;
    currency: string;
    status: PaymentStatus;
    paymentMethod: string;
    paymentGateway: string;
    gatewayTransactionId: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const transactionId = uuidv4();
      
      // Insert transaction into database
      const [transaction] = await this.db.insert(ecommerceTransactions).values({
        id: transactionId,
        orderId: transactionData.orderId,
        userId: transactionData.userId,
        companyId: transactionData.companyId,
        transactionDate: transactionData.transactionDate,
        amount: transactionData.amount,
        currency: transactionData.currency,
        status: transactionData.status,
        paymentMethod: transactionData.paymentMethod,
        paymentGateway: transactionData.paymentGateway,
        gatewayTransactionId: transactionData.gatewayTransactionId,
        metadata: transactionData.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      logger.info(`Created transaction ${transaction.id} for order ${transaction.orderId}`);
      return transaction;
    } catch (error) {
      logger.error('Failed to create transaction', error);
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a transaction by ID
   * 
   * @param transactionId Transaction ID
   * @param type Query type
   * @returns The transaction
   */
  async getTransactionById(transactionId: string, type: 'all' | 'company' = 'company') {
    try {
      const transactions = await this.db.select()
        .from(ecommerceTransactions)
        .where(eq(ecommerceTransactions.id, transactionId));
      
      if (transactions.length === 0) {
        return null;
      }
      
      return transactions[0];
    } catch (error) {
      logger.error(`Failed to get transaction ${transactionId}`, error);
      throw new Error(`Failed to get transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get transactions for an order
   * 
   * @param orderId Order ID
   * @param companyId Company ID
   * @returns Array of transactions
   */
  async getOrderTransactions(orderId: string, companyId: string) {
    try {
      const transactions = await this.db.select()
        .from(ecommerceTransactions)
        .where(
          and(
            eq(ecommerceTransactions.orderId, orderId),
            eq(ecommerceTransactions.companyId, companyId)
          )
        )
        .orderBy(desc(ecommerceTransactions.transactionDate));
      
      return transactions;
    } catch (error) {
      logger.error(`Failed to get transactions for order ${orderId}`, error);
      throw new Error(`Failed to get order transactions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all transactions for a company
   * 
   * @param companyId Company ID
   * @param options Query options
   * @returns Array of transactions
   */
  async getCompanyTransactions(companyId: string, options: {
    limit?: number;
    offset?: number;
    status?: PaymentStatus | 'all';
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = 'all',
        startDate,
        endDate
      } = options;
      
      let query = this.db.select()
        .from(ecommerceTransactions)
        .where(eq(ecommerceTransactions.companyId, companyId));
      
      // Apply status filter if not 'all'
      if (status !== 'all') {
        query = query.where(eq(ecommerceTransactions.status, status));
      }
      
      // Apply date range filters if provided
      if (startDate) {
        query = query.where(ecommerceTransactions.transactionDate >= startDate);
      }
      
      if (endDate) {
        query = query.where(ecommerceTransactions.transactionDate <= endDate);
      }
      
      // Apply sorting and pagination
      query = query.orderBy(desc(ecommerceTransactions.transactionDate))
        .limit(limit)
        .offset(offset);
      
      const transactions = await query;
      return transactions;
    } catch (error) {
      logger.error(`Failed to get transactions for company ${companyId}`, error);
      throw new Error(`Failed to get company transactions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update a transaction's status
   * 
   * @param transactionId Transaction ID
   * @param newStatus New status
   * @param amount Transaction amount
   * @param additionalData Additional data
   * @returns The updated transaction
   */
  async updateTransactionStatus(
    transactionId: string,
    newStatus: PaymentStatus,
    amount: string,
    additionalData: Record<string, any> = {}
  ) {
    try {
      const [updatedTransaction] = await this.db.update(ecommerceTransactions)
        .set({
          status: newStatus,
          metadata: {
            ...additionalData,
            statusUpdatedAt: new Date()
          },
          updatedAt: new Date()
        })
        .where(eq(ecommerceTransactions.id, transactionId))
        .returning();
      
      if (!updatedTransaction) {
        throw new Error('Transaction not found');
      }
      
      logger.info(`Updated transaction ${transactionId} status to ${newStatus}`);
      return updatedTransaction;
    } catch (error) {
      logger.error(`Failed to update transaction ${transactionId} status`, error);
      throw new Error(`Failed to update transaction status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Record a refund for a transaction
   * 
   * @param originalTransactionId Original transaction ID
   * @param refundAmount Refund amount
   * @param companyId Company ID
   * @param userId User ID
   * @param reason Refund reason
   * @returns The refund transaction
   */
  async recordRefund(
    originalTransactionId: string,
    refundAmount: string,
    companyId: string,
    userId: string,
    reason: string
  ) {
    try {
      // Get the original transaction
      const originalTransaction = await this.getTransactionById(originalTransactionId);
      
      if (!originalTransaction) {
        throw new Error('Original transaction not found');
      }
      
      // Check if the refund amount is valid
      if (Number(refundAmount) <= 0 || Number(refundAmount) > Number(originalTransaction.amount)) {
        throw new Error('Invalid refund amount');
      }
      
      // Create a refund transaction
      const refundTransaction = await this.createTransaction({
        orderId: originalTransaction.orderId,
        userId,
        companyId,
        transactionDate: new Date(),
        amount: refundAmount,
        currency: originalTransaction.currency,
        status: PaymentStatus.COMPLETED, // Assuming refund is processed immediately
        paymentMethod: originalTransaction.paymentMethod,
        paymentGateway: originalTransaction.paymentGateway,
        gatewayTransactionId: `refund-${uuidv4()}`,
        metadata: {
          originalTransactionId,
          refundReason: reason,
          type: 'refund'
        }
      });
      
      // Update the original transaction status if it's a full refund
      if (refundAmount === originalTransaction.amount) {
        await this.updateTransactionStatus(
          originalTransactionId,
          PaymentStatus.REFUNDED,
          originalTransaction.amount,
          {
            refundTransactionId: refundTransaction.id,
            refundDate: new Date(),
            refundReason: reason
          }
        );
      } else {
        await this.updateTransactionStatus(
          originalTransactionId,
          PaymentStatus.PARTIALLY_REFUNDED,
          originalTransaction.amount,
          {
            refundTransactionId: refundTransaction.id,
            refundAmount,
            refundDate: new Date(),
            refundReason: reason
          }
        );
      }
      
      logger.info(`Recorded refund of ${refundAmount} ${originalTransaction.currency} for transaction ${originalTransactionId}`);
      return refundTransaction;
    } catch (error) {
      logger.error(`Failed to record refund for transaction ${originalTransactionId}`, error);
      throw new Error(`Failed to record refund: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get summary statistics for transactions
   * 
   * @param companyId Company ID
   * @param period Period for statistics ('day', 'week', 'month', 'year')
   * @returns Transaction statistics
   */
  async getTransactionStatistics(companyId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
    try {
      // Get date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'day':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
      }
      
      // Get transactions for the period
      const transactions = await this.db.select()
        .from(ecommerceTransactions)
        .where(
          and(
            eq(ecommerceTransactions.companyId, companyId),
            ecommerceTransactions.transactionDate >= startDate,
            ecommerceTransactions.transactionDate <= now
          )
        );
      
      // Calculate statistics
      const stats = {
        totalTransactions: transactions.length,
        totalAmount: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
        refundedTransactions: 0,
        averageTransactionAmount: 0,
        currency: transactions.length > 0 ? transactions[0].currency : 'RON', // Default to Romanian currency
        period
      };
      
      transactions.forEach(transaction => {
        // Skip refund transactions to avoid double counting
        if (transaction.metadata && transaction.metadata.type === 'refund') {
          return;
        }
        
        if (transaction.status === PaymentStatus.COMPLETED) {
          stats.successfulTransactions++;
          stats.totalAmount += Number(transaction.amount);
        } else if (transaction.status === PaymentStatus.FAILED) {
          stats.failedTransactions++;
        } else if (transaction.status === PaymentStatus.PENDING) {
          stats.pendingTransactions++;
        } else if (
          transaction.status === PaymentStatus.REFUNDED || 
          transaction.status === PaymentStatus.PARTIALLY_REFUNDED
        ) {
          stats.refundedTransactions++;
        }
      });
      
      if (stats.successfulTransactions > 0) {
        stats.averageTransactionAmount = stats.totalAmount / stats.successfulTransactions;
      }
      
      return stats;
    } catch (error) {
      logger.error(`Failed to get transaction statistics for company ${companyId}`, error);
      throw new Error(`Failed to get transaction statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}