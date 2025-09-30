/**
 * External Integrations API Routes
 */

import { Router } from 'express';
import authGuard, { AuthGuard } from '../../auth/guards/auth.guard';
import { UserRole, JwtAuthMode } from '../../auth/types';
import { exchangeRateService } from '../services/exchange-rate.service';
import { anafService } from '../services/anaf.service';
import { bnrExchangeRateService } from '../services/bnr-exchange-rate.service';
import { CurrencyService } from '../services/currency.service';
import { log } from '../../../vite';
import { Services } from '../../../common/services/registry';
import { fx_rates } from '../../../../shared/schema';
import { and, eq, gte, lte, inArray, asc } from 'drizzle-orm';

// Define interfaces for rate data
interface RateRecord {
  date: Date;
  currency: string;
  rate: string | number;
  source: string;
}

const router = Router();

// Don't require authentication for these specific BNR routes
const PUBLIC_ROUTES = [
  '/exchange-rates/bnr/all',
  '/exchange-rates/bnr/update'
];

// Middleware to check if a route is public
router.use((req, res, next) => {
  // Check if the current path is in the public routes list
  const isPublicRoute = PUBLIC_ROUTES.some(route => req.path === route);
  
  if (isPublicRoute) {
    // This is a public route, continue without auth
    res.setHeader('Content-Type', 'application/json');
    log(`📣 Public access to ${req.path}`, 'api');
    next();
  } else {
    // For all other routes, require authentication
    AuthGuard.protect(JwtAuthMode.REQUIRED)(req, res, next);
  }
});

// Get latest exchange rates - Basic auth required
router.get('/exchange-rates', async (req, res, next) => {
  try {
    const baseCurrency = req.query.base as string || 'RON';
    const rates = await exchangeRateService.getLatestRates(baseCurrency);
    res.json({ 
      base: baseCurrency, 
      date: new Date().toISOString().split('T')[0],
      rates 
    });
  } catch (error) {
    log(`❌ Error in exchange rates API: ${(error as Error).message}`, 'api');
    next(error);
  }
});

// Get Romanian BNR official exchange rates - Basic auth required
router.get('/exchange-rates/bnr', async (req, res, next) => {
  try {
    try {
      const rates = await bnrExchangeRateService.getLatestRates();
      res.json({ 
        base: 'RON',
        date: new Date().toISOString().split('T')[0],
        rates,
        source: 'BNR Official'
      });
    } catch (bnrError) {
      log(`⚠️ BNR service error, falling back to general exchange rate API: ${(bnrError as Error).message}`, 'api');
      const date = req.query.date as string;
      const rates = await exchangeRateService.getBNRReferenceRate(date);
      res.json({ 
        base: 'RON', 
        date: date || new Date().toISOString().split('T')[0],
        rates,
        source: 'BNR Reference (Fallback)'
      });
    }
  } catch (error) {
    log(`❌ Error in BNR exchange rates API: ${(error as Error).message}`, 'api');
    next(error);
  }
});

// Get historical exchange rates for the past 10 days (or specified number of days)
router.get('/exchange-rates/historical', async (req, res, next) => {
  try {
    const currencies = req.query.currencies 
      ? (req.query.currencies as string).split(',') 
      : ['USD', 'EUR', 'TRY']; // Default currencies
    
    const days = parseInt(req.query.days as string || '10');
    const maxDays = 90; // Increased limit to allow more historical data
    
    // Optional source parameter - can be 'BNR', 'BNR_RSS', or blank for all sources
    const source = req.query.source as string || '';
    
    if (isNaN(days) || days <= 0 || days > maxDays) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid number of days. Must be between 1 and ${maxDays}` 
      });
    }

    log(`📈 Fetching historical rates for currencies: ${currencies.join(', ')} for the past ${days} days ${source ? `(source: ${source})` : ''}`, 'api');
    
    const db = Services.db.db;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Start of day X days ago
    
    // Build the query with conditional source filter
    let query = db
      .select({
        currency: fx_rates.currency,
        rate: fx_rates.rate,
        date: fx_rates.date,
        source: fx_rates.source
      })
      .from(fx_rates)
      .where(
        and(
          eq(fx_rates.baseCurrency, 'RON'),
          inArray(fx_rates.currency, currencies),
          gte(fx_rates.date, startDate),
          lte(fx_rates.date, endDate)
        )
      );
    
    // Add source filter if specified
    if (source) {
      query = query.where(eq(fx_rates.source, source));
    }
    
    // Execute the query with ordering
    const ratesData = await query.orderBy(asc(fx_rates.date));
    
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
    
    res.json({
      success: true,
      base: 'RON',
      currencies,
      days,
      data: historicalRates,
      count: historicalRates.length,
      dataPoints: actualDataCount,
      source: source || 'Combined BNR Sources (RSS preferred)',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  } catch (error) {
    log(`❌ Error in historical exchange rates API: ${(error as Error).message}`, 'api');
    next(error);
  }
});

// Manually trigger BNR exchange rate update - Allow for any authenticated user
router.post('/exchange-rates/bnr/update', 
  async (req, res, next) => {
    try {
      log('🔄 Manual BNR exchange rate update triggered', 'api');
      // Set response header to explicitly expect JSON
      res.setHeader('Content-Type', 'application/json');
      
      const rates = await bnrExchangeRateService.manualFetch();
      res.json({
        success: true,
        message: 'BNR exchange rates updated successfully',
        base: 'RON',
        date: new Date().toISOString().split('T')[0],
        rates,
        source: 'BNR Official (RSS)',
        currencyCount: Object.keys(rates).length
      });
    } catch (error) {
      log(`❌ Error in manual BNR update API: ${(error as Error).message}`, 'api');
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        date: new Date().toISOString()
      });
    }
});

// Debug endpoint for testing BNR RSS feeds - Admin only
router.get('/exchange-rates/bnr/test-rss',
  authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res, next) => {
    try {
      log('🔍 Testing BNR RSS feeds...', 'api');
      // Set response header to explicitly expect JSON
      res.setHeader('Content-Type', 'application/json');
      
      // Get RSS feeds from the service
      const rssFeeds = bnrExchangeRateService.getRssFeeds();
      const results: Record<string, any> = {};
      const currencies = Object.keys(rssFeeds);
      
      for (const currency of currencies) {
        try {
          const feedUrl = rssFeeds[currency];
          log(`🔍 Testing RSS feed URL for ${currency}: ${feedUrl}`, 'api');
          
          const httpClient = bnrExchangeRateService['httpClient'];
          const response = await httpClient.get(feedUrl, {
            responseType: 'text',
            timeout: 15000,
            headers: {
              'Accept': 'application/xml, text/xml, */*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          results[currency] = {
            success: true,
            responseLength: response.length,
            message: `Successfully fetched RSS feed for ${currency}`
          };
          
          log(`✅ Successfully fetched RSS feed for ${currency}. Response length: ${response.length}`, 'api');
        } catch (urlError) {
          results[currency] = {
            success: false,
            error: (urlError as Error).message,
            message: `Failed to fetch RSS feed for ${currency}`
          };
          
          log(`❌ Failed to fetch RSS feed for ${currency}: ${(urlError as Error).message}`, 'api');
        }
      }
      
      res.json({
        success: true,
        testTime: new Date().toISOString(),
        results,
        message: 'RSS feed test completed'
      });
    } catch (error) {
      log(`❌ Error in RSS test API: ${(error as Error).message}`, 'api');
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        date: new Date().toISOString()
      });
    }
});

// Convert amount between currencies - Basic auth required
router.get('/exchange-rates/convert', async (req, res, next) => {
  try {
    const amount = parseFloat(req.query.amount as string || '0');
    const from = req.query.from as string || 'RON';
    const to = req.query.to as string || 'EUR';

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Must be a positive number.' });
    }

    const convertedAmount = await exchangeRateService.convertCurrency(amount, from, to);

    res.json({
      amount,
      from,
      to,
      result: convertedAmount,
      date: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    log(`❌ Error in currency conversion API: ${(error as Error).message}`, 'api');
    next(error);
  }
});

// Validate Romanian VAT number through ANAF - Admin/Company Admin only
router.get('/anaf/validate-vat/:vatNumber',
  authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res, next) => {
    try {
      const vatNumber = req.params.vatNumber;

      if (!vatNumber || vatNumber.length < 2) {
        return res.status(400).json({ error: 'Invalid VAT number format' });
      }

      const validationResult = await anafService.validateVat(vatNumber);
      res.json(validationResult);
    } catch (error) {
      log(`❌ Error in VAT validation API: ${(error as Error).message}`, 'api');
      next(error);
    }
});

// Get company information by fiscal code - Admin/Company Admin only
router.get('/anaf/company/:fiscalCode',
  authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res, next) => {
    try {
      const fiscalCode = req.params.fiscalCode;

      if (!fiscalCode || fiscalCode.length < 2) {
        return res.status(400).json({ error: 'Invalid fiscal code format' });
      }

      const companyInfo = await anafService.getCompanyInfo(fiscalCode);

      if (!companyInfo) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json(companyInfo);
    } catch (error) {
      log(`❌ Error in company info API: ${(error as Error).message}`, 'api');
      next(error);
    }
});

// Get all available BNR exchange rates - Basic auth required
router.get('/exchange-rates/bnr/all', async (req, res, next) => {
  try {
    let date: Date | undefined;
    if (req.query.date) {
      date = new Date(req.query.date as string);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    }

    const rates = await CurrencyService.getRates(date);

    res.json({
      base: 'RON',
      date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rates,
      count: Object.keys(rates).length,
      source: 'BNR Official'
    });
  } catch (error) {
    log(`❌ Error in BNR rates API: ${(error as Error).message}`, 'api');
    next(error);
  }
});

export default router;