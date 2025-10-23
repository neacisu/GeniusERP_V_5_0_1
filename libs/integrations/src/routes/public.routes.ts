/**
 * Public Integrations API Routes (No Authentication Required)
 */

import { Router, Request, Response } from 'express';
import { bnrExchangeRateService } from '../services/bnr-exchange-rate.service';
import { CurrencyService } from '../services/currency.service';
import { log } from '../../../../apps/api/src/vite';
import { Services } from "@common/services/registry";
import { fx_rates } from '@geniuserp/shared';
import { and, eq, gte, lte, inArray, asc } from 'drizzle-orm';

// Define interfaces for rate data
interface RateRecord {
  date: Date;
  currency: string;
  rate: string | number;
  source: string;
}

const router = Router();

// Get all available BNR exchange rates - Public Access
router.get('/exchange-rates/bnr/all', async (req: Request, res: Response) => {
  try {
    // Set response header to explicitly expect JSON
    res.setHeader('Content-Type', 'application/json');
    
    log('📣 Public access to BNR exchange rates', 'api');
    
    let date: Date | undefined;
    if (req.query['date']) {
      date = new Date(req.query['date'] as string);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    }

    const rates = await CurrencyService.getRates(date);

    return res.json({
      base: 'RON',
      date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rates,
      count: Object.keys(rates).length,
      source: 'BNR Official (RSS)',
      public: true
    });
  } catch (error) {
    log(`❌ Error in public BNR rates API: ${(error as Error).message}`, 'api');
    return res.status(500).json({ 
      success: false, 
      error: (error as Error).message,
      public: true
    });
  }
});

// Get historical exchange rates for the past 10 days (or specified number of days) - Public Access
router.get('/exchange-rates/historical', async (req: Request, res: Response) => {
  try {
    // Set response header to explicitly expect JSON
    res.setHeader('Content-Type', 'application/json');
    
    log('📣 Public access to historical exchange rates', 'api');
    
    const currencies = req.query['currencies'] 
      ? (req.query['currencies'] as string).split(',') 
      : ['USD', 'EUR', 'TRY']; // Default currencies
    
    const days = parseInt(req.query['days'] as string || '10');
    const maxDays = 90; // Increased limit to allow more historical data
    
    // Optional source parameter - can be 'BNR', 'BNR_RSS', or blank for all sources
    const source = req.query['source'] as string || '';
    
    if (isNaN(days) || days <= 0 || days > maxDays) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid number of days. Must be between 1 and ${maxDays}` 
      });
    }

    log(`📈 Fetching historical rates for currencies: ${currencies.join(', ')} for the past ${days} days ${source ? `(source: ${source})` : ''}`, 'api');
    
    const db = Services.db;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Start of day X days ago
    
    // Build the query with conditional source filter
    const whereConditions = [
      eq(fx_rates.baseCurrency, 'RON'),
      inArray(fx_rates.currency, currencies),
      gte(fx_rates.date, startDate),
      lte(fx_rates.date, endDate)
    ];
    
    // Add source filter if specified
    if (source) {
      whereConditions.push(eq(fx_rates.source, source));
    }
    
    // Execute the query with ordering
    const ratesData = await db
      .select({
        currency: fx_rates.currency,
        rate: fx_rates.rate,
        date: fx_rates.date,
        source: fx_rates.source
      })
      .from(fx_rates)
      .where(and(...whereConditions))
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
    
    // Process data prioritizing RSS source over BNR when both exist for same date/currency
    // Group data by date and currency to find the best rate for each
    const bestRatesByDateAndCurrency = new Map();
    
    ratesData.forEach((record: RateRecord) => {
      const dateStr = record.date.toISOString().split('T')[0];
      const key = `${dateStr}_${record.currency}`;
      
      // If we don't have a rate for this date/currency yet, or if this is from RSS and we have BNR
      const existingRecord = bestRatesByDateAndCurrency.get(key);
      
      if (!existingRecord || 
          (record.source === 'BNR_RSS' && existingRecord.source === 'BNR')) {
        bestRatesByDateAndCurrency.set(key, {
          currency: record.currency,
          rate: parseFloat(record.rate.toString()),
          date: dateStr,
          source: record.source
        });
      }
    });
    
    // Apply the best rates to our date map
    bestRatesByDateAndCurrency.forEach((bestRate: { date: string, currency: string, rate: number, source: string }) => {
      const dateStr = bestRate.date;
      if (dateMap.has(dateStr)) {
        const entry = dateMap.get(dateStr);
        entry[bestRate.currency] = bestRate.rate;
      }
    });
    
    // Convert map to array and sort by date
    const historicalRates = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const actualDataCount = bestRatesByDateAndCurrency.size;
    
    return res.json({
      success: true,
      base: 'RON',
      currencies,
      days,
      data: historicalRates,
      count: historicalRates.length,
      dataPoints: actualDataCount,
      source: source || 'Combined BNR Sources (RSS preferred)',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      public: true
    });
  } catch (error) {
    log(`❌ Error in historical exchange rates API: ${(error as Error).message}`, 'api');
    return res.status(500).json({ 
      success: false, 
      error: (error as Error).message,
      public: true
    });
  }
});

// Manually trigger BNR exchange rate update - Public Access
router.post('/exchange-rates/bnr/update', async (_req: Request, res: Response) => {
  try {
    // Set response header to explicitly expect JSON
    res.setHeader('Content-Type', 'application/json');
    
    log('🔄 Manual BNR exchange rate update triggered (public access)', 'api');
    
    const rates = await bnrExchangeRateService.manualFetch();
    
    return res.json({
      success: true,
      message: 'BNR exchange rates updated successfully',
      base: 'RON',
      date: new Date().toISOString().split('T')[0],
      rates,
      source: 'BNR Official (RSS)',
      currencyCount: Object.keys(rates).length,
      public: true
    });
  } catch (error) {
    log(`❌ Error in public BNR update API: ${(error as Error).message}`, 'api');
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
      date: new Date().toISOString(),
      public: true
    });
  }
});

export default router;