/**
 * Financial Reports Service
 * 
 * Service for generating financial KPIs and summary reports
 * Includes Redis caching for performance optimization
 */

import { getPostgresClient } from "@common/drizzle/db";
import { RedisService } from '@common/services/redis.service';

/**
 * Financial report interface
 */
export interface FinancialReport {
  id: string;
  name: string;
  value: number;
  type: 'income' | 'expense' | 'asset' | 'liability';
}

/**
 * Financial indicators (KPIs) interface
 */
export interface FinancialIndicators {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  cashBalance: number;
  bankBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

/**
 * Service pentru rapoarte financiare
 */
export class FinancialReportsService {
   /**
   * Get financial reports summary with caching
   */
  async getFinancialReports(companyId: string): Promise<FinancialReport[]> {
    // Check cache first
    const redisService = new RedisService();
    await redisService.connect();
    
    const cacheKey = `acc:financial-reports:${companyId}`;
    const cached = await redisService.getCached<FinancialReport[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Calculate from database using postgres client directly
    const client = getPostgresClient();
    
    // Use tagged template literals for safe SQL queries
    const sales = await client<{ total: string }[]>`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM invoices 
      WHERE company_id = ${companyId}
      AND type = 'INVOICE'
      AND deleted_at IS NULL
    `;
    
    const purchases = await client<{ total: string }[]>`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM invoices 
      WHERE company_id = ${companyId}
      AND type = 'PURCHASE'
      AND deleted_at IS NULL
    `;
    
    const cashBalance = await client<{ total: string }[]>`
      SELECT COALESCE(SUM(current_balance), 0) as total 
      FROM cash_registers 
      WHERE company_id = ${companyId}
      AND is_active = true
    `;
    
    const bankBalance = await client<{ total: string }[]>`
      SELECT COALESCE(SUM(current_balance), 0) as total 
      FROM bank_accounts 
      WHERE company_id = ${companyId}
      AND is_active = true
    `;
    
    const reports: FinancialReport[] = [
      {
        id: '1',
        name: 'Vânzări',
        value: Number(sales[0]?.total || 0),
        type: 'income'
      },
      {
        id: '2',
        name: 'Achiziții',
        value: Number(purchases[0]?.total || 0),
        type: 'expense'
      },
      {
        id: '3',
        name: 'Sold Casă',
        value: Number(cashBalance[0]?.total || 0),
        type: 'asset'
      },
      {
        id: '4',
        name: 'Sold Bancă',
        value: Number(bankBalance[0]?.total || 0),
        type: 'asset'
      }
    ];
    
    // Cache for 5 minutes
    if (redisService.isConnected()) {
      await redisService.setCached(cacheKey, reports, 300);
    }
    
    return reports;
  }
  
  /**
   * Get financial indicators (KPIs) with caching
   */
  async getFinancialIndicators(companyId: string): Promise<FinancialIndicators> {
    // Check cache first
    const redisService = new RedisService();
    await redisService.connect();
    
    const cacheKey = `acc:financial-indicators:${companyId}`;
    const cached = await redisService.getCached<FinancialIndicators>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Calculate from database using postgres client directly
    const client = getPostgresClient();
    
    // Use tagged template literals for safe SQL queries
    const [salesResult, purchasesResult, cashResult, bankResult] = await Promise.all([
      client<{ total: string }[]>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM invoices 
        WHERE company_id = ${companyId}
        AND type = 'INVOICE'
        AND deleted_at IS NULL
      `,
      
      client<{ total: string }[]>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM invoices 
        WHERE company_id = ${companyId}
        AND type = 'PURCHASE'
        AND deleted_at IS NULL
      `,
      
      client<{ total: string }[]>`
        SELECT COALESCE(SUM(current_balance), 0) as total 
        FROM cash_registers 
        WHERE company_id = ${companyId}
        AND is_active = true
      `,
      
      client<{ total: string }[]>`
        SELECT COALESCE(SUM(current_balance), 0) as total 
        FROM bank_accounts 
        WHERE company_id = ${companyId}
        AND is_active = true
      `
    ]);
    
    const totalRevenue = Number(salesResult[0]?.total || 0);
    const totalExpenses = Number(purchasesResult[0]?.total || 0);
    const cashBalance = Number(cashResult[0]?.total || 0);
    const bankBalance = Number(bankResult[0]?.total || 0);
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const totalAssets = cashBalance + bankBalance;
    
    // Get liabilities (suppliers balance - unpaid purchase invoices)
    // Calculate unpaid amount by subtracting payments from invoice amounts
    const liabilitiesResult = await client<{ total: string }[]>`
      SELECT COALESCE(SUM(i.amount - COALESCE(p.paid_amount, 0)), 0) as total 
      FROM invoices i
      LEFT JOIN (
        SELECT invoice_id, SUM(amount) as paid_amount
        FROM invoice_payments
        WHERE company_id = ${companyId}
        GROUP BY invoice_id
      ) p ON i.id = p.invoice_id
      WHERE i.company_id = ${companyId}
      AND i.type = 'PURCHASE'
      AND i.status != 'paid'
      AND i.deleted_at IS NULL
    `;
    
    const totalLiabilities = Number(liabilitiesResult[0]?.total || 0);
    const netWorth = totalAssets - totalLiabilities;
    
    const indicators: FinancialIndicators = {
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      cashBalance,
      bankBalance,
      totalAssets,
      totalLiabilities,
      netWorth
    };
    
    // Cache for 5 minutes
    if (redisService.isConnected()) {
      await redisService.setCached(cacheKey, indicators, 300);
    }
    
    return indicators;
  }
  
  /**
   * Invalidate financial reports cache
   * Call this after creating invoices, payments, etc.
   */
  async invalidateCache(companyId: string): Promise<void> {
    const redisService = new RedisService();
    await redisService.connect();
    
    if (redisService.isConnected()) {
      await redisService.invalidatePattern(`acc:financial-reports:${companyId}`);
      await redisService.invalidatePattern(`acc:financial-indicators:${companyId}`);
    }
  }
}

// Export singleton instance
export const financialReportsService = new FinancialReportsService();

