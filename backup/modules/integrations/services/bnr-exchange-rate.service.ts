/**
 * BNR Exchange Rate Service
 * 
 * This service provides official exchange rates from the National Bank of Romania (BNR)
 * by fetching the daily XML feed and storing rates in the database.
 */

import { createHttpClient, HttpClient } from '../../../shared/libs/http-client';
import { log } from '../../../vite';
import { parseStringPromise } from 'xml2js';
import { Services } from '../../../common/services/registry';
import { fx_rates } from '../../../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import cron from 'node-cron';

export class BnrExchangeRateService {
  private httpClient: HttpClient;
  private bnrXmlUrl = 'https://www.bnr.ro/nbrfxrates.xml';
  
  constructor() {
    this.httpClient = createHttpClient({
      timeout: 10000,
    });
  }
  
  /**
   * Get drizzle db instance
   */
  private get db() {
    return Services.db.db;
  }
  
  /**
   * Initialize the BNR exchange rate service with daily cron job
   */
  initialize(): void {
    // Schedule the job to run at 14:30 Romania time (EET/EEST)
    cron.schedule('30 14 * * *', async () => {
      try {
        await this.fetchAndStoreRates();
        log('🔄 Scheduled BNR exchange rate update completed successfully', 'bnr-exchange');
      } catch (error) {
        log(`❌ Scheduled BNR exchange rate update failed: ${(error as Error).message}`, 'bnr-exchange');
      }
    }, {
      timezone: 'Europe/Bucharest'
    });
    
    log('📅 BNR exchange rate daily sync scheduled for 14:30 Romania time', 'bnr-exchange');
  }
  
  /**
   * Fetch the latest rates from BNR and store them in the database
   */
  async fetchAndStoreRates(): Promise<void> {
    try {
      log('🌐 Fetching exchange rates from BNR XML feed...', 'bnr-exchange');
      
      const response = await this.httpClient.get(this.bnrXmlUrl, {
        responseType: 'text'
      });
      
      // Parse XML response
      const parsed = await parseStringPromise(response);
      
      if (!parsed || !parsed.DataSet || !parsed.DataSet.Body || !parsed.DataSet.Body[0] || 
          !parsed.DataSet.Body[0].Cube || !parsed.DataSet.Body[0].Cube[0] || 
          !parsed.DataSet.Body[0].Cube[0].Rate) {
        throw new Error('Invalid XML structure from BNR');
      }
      
      // Extract rates from XML
      const rates = parsed.DataSet.Body[0].Cube[0].Rate;
      const dateStr = parsed.DataSet.Body[0].Cube[0].$.date;
      const date = new Date(dateStr);
      
      log(`📊 Processing ${rates.length} exchange rates from BNR for date ${dateStr}`, 'bnr-exchange');
      
      // Process each rate
      for (const rate of rates) {
        const currency = rate.$.currency;
        const rateValue = parseFloat(rate._);
        
        // Store the rate in database
        await this.db.insert(fx_rates).values({
          currency,
          rate: rateValue.toString(), // Convert numeric value to string for Drizzle/PostgreSQL
          source: 'BNR',
          baseCurrency: 'RON',
          date
        }).onConflictDoUpdate({
          target: [fx_rates.currency, fx_rates.date, fx_rates.source, fx_rates.baseCurrency],
          set: { rate: rateValue.toString(), updatedAt: new Date() }
        });
      }
      
      log(`✅ Successfully stored ${rates.length} BNR exchange rates in database`, 'bnr-exchange');
    } catch (error) {
      log(`❌ Error fetching BNR exchange rates: ${(error as Error).message}`, 'bnr-exchange');
      throw new Error(`Failed to fetch and store BNR exchange rates: ${(error as Error).message}`);
    }
  }
  
  /**
   * Get the latest BNR exchange rates from the database
   * If no rates are found, fetches from BNR and stores them
   */
  async getLatestRates(): Promise<Record<string, number>> {
    try {
      // Try to get the latest rates from the database
      const latestRates = await this.db.select()
        .from(fx_rates)
        .where(and(
          eq(fx_rates.source, 'BNR'),
          eq(fx_rates.baseCurrency, 'RON')
        ))
        .orderBy(desc(fx_rates.date))
        .limit(100);
      
      // If no rates in DB, fetch from BNR
      if (!latestRates || latestRates.length === 0) {
        log('🔄 No BNR rates found in database, fetching from source...', 'bnr-exchange');
        await this.fetchAndStoreRates();
        return this.getLatestRates(); // Retry after fetching
      }
      
      // Group by currency and get the latest rate for each
      const latestDate = latestRates[0].date;
      const todayRates = latestRates.filter((rate: typeof latestRates[0]) => 
        rate.date.toISOString().split('T')[0] === latestDate.toISOString().split('T')[0]
      );
      
      // Convert to simple object
      const ratesObject: Record<string, number> = {};
      for (const rate of todayRates) {
        ratesObject[rate.currency] = parseFloat(rate.rate.toString());
      }
      
      log(`📈 Retrieved ${Object.keys(ratesObject).length} BNR exchange rates from database`, 'bnr-exchange');
      return ratesObject;
    } catch (error) {
      log(`❌ Error getting BNR exchange rates: ${(error as Error).message}`, 'bnr-exchange');
      throw new Error(`Failed to get BNR exchange rates: ${(error as Error).message}`);
    }
  }
  
  /**
   * Manually trigger a fetch of BNR rates
   * Useful for testing or initial setup
   */
  async manualFetch(): Promise<Record<string, number>> {
    await this.fetchAndStoreRates();
    return this.getLatestRates();
  }
  
  /**
   * Get the exchange rate for a specific currency
   */
  async getRateForCurrency(currency: string): Promise<number | null> {
    try {
      const rates = await this.getLatestRates();
      return rates[currency] || null;
    } catch (error) {
      log(`❌ Error getting rate for ${currency}: ${(error as Error).message}`, 'bnr-exchange');
      throw new Error(`Failed to get rate for ${currency}: ${(error as Error).message}`);
    }
  }
}

// Create singleton instance
export const bnrExchangeRateService = new BnrExchangeRateService();