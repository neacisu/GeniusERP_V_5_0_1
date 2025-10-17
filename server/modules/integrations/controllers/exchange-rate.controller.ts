/**
 * Exchange Rate Controller
 * 
 * Controller for handling currency exchange rate operations
 */

import { Request, Response } from 'express';
import { exchangeRateService } from '../services/exchange-rate.service';
import { bnrExchangeRateService } from '../services/bnr-exchange-rate.service';
import { CurrencyService } from '../services/currency.service';
import { AuditService } from '../../audit/services/audit.service';
import { Services } from '../../../common/services/registry';
import { fx_rates } from '../../../../shared/schema';
import { and, eq, gte, lte, inArray, asc } from 'drizzle-orm';

// For audit logging
const RESOURCE_TYPE = 'exchange_rate';

/**
 * Controller for handling currency exchange rate operations
 */
export class ExchangeRateController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Get latest exchange rates
   */
  async getLatestRates(req: Request, res: Response): Promise<Response> {
    try {
      const baseCurrency = req.query.base as string || 'RON';
      const rates = await exchangeRateService.getLatestRates(baseCurrency);
      
      return res.status(200).json({ 
        success: true,
        base: baseCurrency, 
        date: new Date().toISOString().split('T')[0],
        rates 
      });
    } catch (error) {
      console.error('[ExchangeRateController] Get latest rates error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve latest exchange rates'
      });
    }
  }

  /**
   * Get Romanian BNR official exchange rates
   */
  async getBnrRates(req: Request, res: Response): Promise<Response> {
    try {
      try {
        const rates = await bnrExchangeRateService.getLatestRates();
        return res.status(200).json({ 
          success: true,
          base: 'RON',
          date: new Date().toISOString().split('T')[0],
          rates,
          source: 'BNR Official'
        });
      } catch (bnrError) {
        console.warn('[ExchangeRateController] BNR service error, falling back to general exchange rate API:', bnrError instanceof Error ? bnrError.message : String(bnrError));
        
        const date = req.query.date as string;
        const rates = await exchangeRateService.getBNRReferenceRate(date);
        
        return res.status(200).json({ 
          success: true,
          base: 'RON', 
          date: date || new Date().toISOString().split('T')[0],
          rates,
          source: 'BNR Reference (Fallback)'
        });
      }
    } catch (error) {
      console.error('[ExchangeRateController] Get BNR rates error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve BNR exchange rates'
      });
    }
  }

  /**
   * Manually trigger BNR exchange rate update
   */
  async manualUpdateBnrRates(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      console.log('[ExchangeRateController] Manual BNR exchange rate update triggered by user:', userId);
      const rates = await bnrExchangeRateService.manualFetch();
      
      // Audit log for manual update
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'update',
        details: {
          message: 'Manual BNR exchange rate update',
          currencyCount: Object.keys(rates).length
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'BNR exchange rates updated successfully',
        base: 'RON',
        date: new Date().toISOString().split('T')[0],
        rates,
        source: 'BNR Official',
        currencyCount: Object.keys(rates).length
      });
    } catch (error) {
      console.error('[ExchangeRateController] Manual update BNR rates error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to manually update BNR exchange rates'
      });
    }
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(req: Request, res: Response): Promise<Response> {
    try {
      const amount = parseFloat(req.query.amount as string || '0');
      const from = req.query.from as string || 'RON';
      const to = req.query.to as string || 'EUR';

      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid amount. Must be a positive number.' 
        });
      }

      const convertedAmount = await exchangeRateService.convertCurrency(amount, from, to);

      return res.status(200).json({
        success: true,
        amount,
        from,
        to,
        result: convertedAmount,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('[ExchangeRateController] Convert currency error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to convert currency'
      });
    }
  }

  /**
   * Get all available BNR exchange rates
   */
  async getAllBnrRates(req: Request, res: Response): Promise<Response> {
    try {
      let date: Date | undefined;
      if (req.query.date) {
        date = new Date(req.query.date as string);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ 
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD' 
          });
        }
      }

      const rates = await CurrencyService.getRates(date);

      return res.status(200).json({
        success: true,
        base: 'RON',
        date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        rates,
        count: Object.keys(rates).length,
        source: 'BNR Official'
      });
    } catch (error) {
      console.error('[ExchangeRateController] Get all BNR rates error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve all BNR exchange rates'
      });
    }
  }

  /**
   * Get historical exchange rates for the past 10 days
   */
  async getHistoricalRates(req: Request, res: Response): Promise<Response> {
    try {
      const currencies = req.query.currencies 
        ? (req.query.currencies as string).split(',') 
        : ['USD', 'EUR', 'TRY']; // Default currencies
      
      const days = parseInt(req.query.days as string || '10');
      const maxDays = 30; // Limit for performance reasons
      
      if (isNaN(days) || days <= 0 || days > maxDays) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid number of days. Must be between 1 and ${maxDays}` 
        });
      }

      console.log(`[ExchangeRateController] Fetching historical rates for currencies: ${currencies.join(', ')} for the past ${days} days`);
      
      const db = Services.db.db;
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999); // End of today
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0); // Start of day 10 days ago
      
      // Query the database for historical rates
      const ratesData = await db
        .select({
          currency: fx_rates.currency,
          rate: fx_rates.rate,
          date: fx_rates.date
        })
        .from(fx_rates)
        .where(
          and(
            eq(fx_rates.baseCurrency, 'RON'),
            inArray(fx_rates.currency, currencies),
            gte(fx_rates.date, startDate),
            lte(fx_rates.date, endDate)
          )
        )
        .orderBy(asc(fx_rates.date));
      
      // Format the data for easy consumption in the frontend
      const dateMap = new Map();
      
      // Initialize the dates for all days in the range
      for (let i = 0; i < days; i++) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dateMap.set(dateStr, { date: dateStr });
        
        // Initialize currency rates as null for each date
        currencies.forEach(currency => {
          dateMap.get(dateStr)[currency] = null;
        });
      }
      
      // Fill in the rates where we have data
      ratesData.forEach((record: any) => {
        const dateStr = record.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
          const entry = dateMap.get(dateStr);
          entry[record.currency] = parseFloat(record.rate.toString());
        }
      });
      
      // Convert map to array and sort by date
      const historicalRates = Array.from(dateMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return res.status(200).json({
        success: true,
        base: 'RON',
        currencies,
        days,
        data: historicalRates,
        count: historicalRates.length,
        source: 'BNR Official'
      });
    } catch (error) {
      console.error('[ExchangeRateController] Get historical rates error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve historical exchange rates'
      });
    }
  }
}

// Export singleton instance
export const exchangeRateController = new ExchangeRateController();