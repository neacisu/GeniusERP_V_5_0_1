import { Response } from 'express';
import { AuthenticatedRequest } from "@common/middleware/auth-types";
import { db } from '@api/db';
import { createModuleLogger } from '@common/logger/loki-logger';
import { accounting_ledger_entries, accounting_ledger_lines } from '../schema/accounting.schema';
import { eq, and, desc } from 'drizzle-orm';

const logger = createModuleLogger('MetricsController');

interface Transaction {
  id: string;
  date: Date;
  description: string | null;
  amount: string;
  type: string | null;
  document_number: string | null;
}

/**
 * MetricsController
 * 
 * Handles accounting metrics and financial KPIs
 */
export class MetricsController {
  /**
   * Get accounting metrics for dashboard
   * Calculates: Total Assets, Liabilities, Equity, Revenue, Expenses, and Financial Ratios
   */
  async getAccountingMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      // Query ledger lines to calculate metrics using Drizzle ORM
      const result = await db
        .select({
          accountClass: accounting_ledger_lines.accountClass,
          debitAmount: accounting_ledger_lines.debitAmount,
          creditAmount: accounting_ledger_lines.creditAmount,
          fullAccountNumber: accounting_ledger_lines.fullAccountNumber
        })
        .from(accountingLedgerLines)
        .innerJoin(
          accountingLedgerEntries,
          eq(accountingLedgerLines.ledgerEntryId, accountingLedgerEntries.id)
        )
        .where(
          and(
            eq(accountingLedgerLines.companyId, companyId),
            eq(accountingLedgerEntries.isPosted, true)
          )
        );

      const ledgerLines = result.map(row => ({
        account_class: row.accountClass,
        debit_amount: String(row.debitAmount),
        credit_amount: String(row.creditAmount),
        full_account_number: row.fullAccountNumber
      }));

      // Calculate totals by account class
      // Class 1: Capital (Equity)
      // Class 2: Fixed Assets
      // Class 3: Inventory and Current Assets
      // Class 4: Third Parties (Receivables/Payables)
      // Class 5: Bank and Cash
      // Class 6: Expenses
      // Class 7: Revenue
      
      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;
      let totalRevenue = 0;
      let totalExpenses = 0;
      let currentAssets = 0;
      let currentLiabilities = 0;
      let inventory = 0;

      for (const line of ledgerLines) {
        const netAmount = Number(line.debit_amount) - Number(line.credit_amount);
        const accountClass = line.account_class;

        // Assets (Classes 2, 3, 5 - debit balance)
        if (accountClass === 2) {
          // Fixed Assets
          totalAssets += netAmount;
        } else if (accountClass === 3) {
          // Inventory and Current Assets
          totalAssets += netAmount;
          currentAssets += netAmount;
          if (line.full_account_number.startsWith('3')) {
            inventory += netAmount;
          }
        } else if (accountClass === 5) {
          // Bank and Cash
          totalAssets += netAmount;
          currentAssets += netAmount;
        }
        
        // Liabilities (Class 4 - credit balance for payables)
        else if (accountClass === 4) {
          if (line.full_account_number.startsWith('40')) {
            // Suppliers (credit balance = liability)
            totalLiabilities += Math.abs(netAmount);
            currentLiabilities += Math.abs(netAmount);
          } else if (line.full_account_number.startsWith('41')) {
            // Customers (debit balance = asset)
            totalAssets += netAmount;
            currentAssets += netAmount;
          } else if (line.full_account_number.startsWith('42') || 
                     line.full_account_number.startsWith('43') ||
                     line.full_account_number.startsWith('44')) {
            // Social security, taxes, personnel (credit balance = liability)
            totalLiabilities += Math.abs(netAmount);
            currentLiabilities += Math.abs(netAmount);
          }
        }
        
        // Equity (Class 1 - credit balance)
        else if (accountClass === 1) {
          totalEquity += Math.abs(netAmount);
        }
        
        // Revenue (Class 7 - credit balance)
        else if (accountClass === 7) {
          totalRevenue += Math.abs(netAmount);
        }
        
        // Expenses (Class 6 - debit balance)
        else if (accountClass === 6) {
          totalExpenses += netAmount;
        }
      }

      // Calculate financial ratios
      const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
      const quickRatio = currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0;
      const debtToEquityRatio = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
      const profitMargin = totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : 0;

      // Balance sheet equation: Assets = Liabilities + Equity
      // Adjust equity to balance if needed (profit/loss)
      const calculatedEquity = totalAssets - totalLiabilities;

      const metrics = {
        totalAssets: Number(totalAssets.toFixed(2)),
        totalLiabilities: Number(totalLiabilities.toFixed(2)),
        totalEquity: Number(calculatedEquity.toFixed(2)),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        currentRatio: Number(currentRatio.toFixed(2)),
        quickRatio: Number(quickRatio.toFixed(2)),
        debtToEquityRatio: Number(debtToEquityRatio.toFixed(2)),
        profitMargin: Number(profitMargin.toFixed(4)),
        currentAssets: Number(currentAssets.toFixed(2)),
        currentLiabilities: Number(currentLiabilities.toFixed(2)),
        inventory: Number(inventory.toFixed(2))
      };

      logger.info(`Accounting metrics calculated for company ${companyId}`);

      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Error calculating accounting metrics:', error);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to calculate accounting metrics' 
      });
    }
  }

  /**
   * Get recent transactions for dashboard
   * Returns last 10 posted transactions
   */
  async getRecentTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const limit = parseInt(req.query['limit'] as string) || 10;

      const result = await db
        .select({
          id: accounting_ledger_entries.id,
          date: accounting_ledger_entries.transactionDate,
          description: accounting_ledger_entries.description,
          amount: accounting_ledger_entries.totalAmount,
          type: accounting_ledger_entries.type,
          documentNumber: accounting_ledger_entries.documentNumber
        })
        .from(accountingLedgerEntries)
        .where(
          and(
            eq(accountingLedgerEntries.companyId, companyId),
            eq(accountingLedgerEntries.isPosted, true)
          )
        )
        .orderBy(desc(accountingLedgerEntries.transactionDate))
        .limit(limit);

      const transactions: Transaction[] = result.map(row => ({
        id: row.id,
        date: row.date,
        description: row.description,
        amount: String(row.amount),
        type: row.type,
        document_number: row.documentNumber
      }));

      const formattedTransactions = transactions.map((t: Transaction) => ({
        id: t.id,
        date: t.date,
        description: t.description || 'No description',
        amount: Number(t.amount),
        type: t.type?.toLowerCase() || 'other',
        documentNumber: t.document_number
      }));

      logger.info(`Retrieved ${formattedTransactions.length} recent transactions for company ${companyId}`);

      res.status(200).json(formattedTransactions);
    } catch (error) {
      logger.error('Error fetching recent transactions:', error);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to fetch recent transactions' 
      });
    }
  }
}
