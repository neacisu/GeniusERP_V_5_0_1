/**
 * Transactions Controller
 * 
 * This controller handles operations related to e-commerce transactions.
 */

import { Router, Request, Response } from 'express';
import { TransactionsService } from '../services/transactions.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { PaymentStatus } from '../../../../shared/schema/ecommerce.schema';
import { Logger } from "@common/logger";

// Create a logger
const logger = new Logger('TransactionsController');

export class TransactionsController {
  private router: Router;
  private transactionsService: TransactionsService;

  constructor(transactionsService: TransactionsService) {
    this.router = Router();
    this.transactionsService = transactionsService;
    this.setupRoutes();
    logger.info('TransactionsController initialized');
  }

  /**
   * Get the router
   * 
   * @returns Express router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Setup routes
   */
  private setupRoutes() {
    // Get all transactions for a company
    this.router.get('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getTransactions.bind(this));
    
    // Get transaction by ID
    this.router.get('/:transactionId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getTransactionById.bind(this));
    
    // Get transactions for an order
    this.router.get('/order/:orderId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getOrderTransactions.bind(this));
    
    // Create transaction
    this.router.post('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.createTransaction.bind(this));
    
    // Update transaction status
    this.router.patch('/:transactionId/status', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateTransactionStatus.bind(this));
    
    // Process refund
    this.router.post('/:transactionId/refund', AuthGuard.protect(JwtAuthMode.REQUIRED), this.processRefund.bind(this));
    
    // Get transaction statistics
    this.router.get('/stats/summary', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getTransactionStatistics.bind(this));
  }

  /**
   * Get all transactions for a company
   * 
   * @param req Request
   * @param res Response
   */
  private async getTransactions(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      const {
        limit = '50',
        offset = '0',
        status = 'all',
        startDate,
        endDate
      } = req.query;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      const options = {
        limit: Number(limit),
        offset: Number(offset),
        status: status as PaymentStatus | 'all',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };
      
      const transactions = await this.transactionsService.getCompanyTransactions(companyId, options);
      
      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      logger.error('Failed to get transactions', error);
      res.status(500).json({
        success: false,
        message: `Failed to get transactions: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Get transaction by ID
   * 
   * @param req Request
   * @param res Response
   */
  private async getTransactionById(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const transaction = await this.transactionsService.getTransactionById(transactionId);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
      
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error(`Failed to get transaction ${req.params.transactionId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to get transaction: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Get transactions for an order
   * 
   * @param req Request
   * @param res Response
   */
  private async getOrderTransactions(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      const transactions = await this.transactionsService.getOrderTransactions(orderId, companyId);
      
      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      logger.error(`Failed to get transactions for order ${req.params.orderId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to get order transactions: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Create transaction
   * 
   * @param req Request
   * @param res Response
   */
  private async createTransaction(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId, userId } = req.user;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      const transactionData = {
        ...req.body,
        companyId,
        userId,
        transactionDate: new Date()
      };
      
      const transaction = await this.transactionsService.createTransaction(transactionData);
      
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Failed to create transaction', error);
      res.status(500).json({
        success: false,
        message: `Failed to create transaction: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Update transaction status
   * 
   * @param req Request
   * @param res Response
   */
  private async updateTransactionStatus(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const { status, amount, additionalData } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      if (!status || !Object.values(PaymentStatus).includes(status as PaymentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment status'
        });
      }
      
      const updatedTransaction = await this.transactionsService.updateTransactionStatus(
        transactionId,
        status as PaymentStatus,
        amount,
        additionalData
      );
      
      res.json({
        success: true,
        data: updatedTransaction
      });
    } catch (error) {
      logger.error(`Failed to update transaction status for ${req.params.transactionId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to update transaction status: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Process refund
   * 
   * @param req Request
   * @param res Response
   */
  private async processRefund(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const { refundAmount, reason } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId, userId } = req.user;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      if (!refundAmount || isNaN(Number(refundAmount)) || Number(refundAmount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid refund amount is required'
        });
      }
      
      const refundTransaction = await this.transactionsService.recordRefund(
        transactionId,
        refundAmount.toString(),
        companyId,
        userId,
        reason || 'Customer requested refund'
      );
      
      res.json({
        success: true,
        data: refundTransaction
      });
    } catch (error) {
      logger.error(`Failed to process refund for transaction ${req.params.transactionId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to process refund: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Get transaction statistics
   * 
   * @param req Request
   * @param res Response
   */
  private async getTransactionStatistics(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      const { period = 'month' } = req.query;
      
      const stats = await this.transactionsService.getTransactionStatistics(
        companyId,
        period as 'day' | 'week' | 'month' | 'year'
      );
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get transaction statistics', error);
      res.status(500).json({
        success: false,
        message: `Failed to get transaction statistics: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}