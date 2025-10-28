/**
 * BNR Exchange Rate Service
 * 
 * This service provides official exchange rates from the National Bank of Romania (BNR)
 * by fetching RSS feeds for specific currencies (with historical data) and using XML as a fallback.
 */

import { createHttpClient, HttpClient } from '@geniuserp/shared/libs/http-client';
import { parseStringPromise } from 'xml2js';
import { Services } from "@common/services/registry";
import { fx_rates } from '@geniuserp/shared';
import { eq, and, desc } from 'drizzle-orm';
import cron from 'node-cron';

// Currency RSS feed URLs - each RSS feed contains around 10 days of historical data
const BNR_CURRENCY_RSS_FEEDS = {
  EUR: 'https://www.bnro.ro/RSS_200003_EUR.aspx', // Corrected domain from bnr.ro to bnro.ro
  USD: 'https://www.bnro.ro/RSS_200004_USD.aspx', // Corrected domain from bnr.ro to bnro.ro
  TRY: 'https://www.bnro.ro/RSS_200023_TRY.aspx'  // Corrected domain from bnr.ro to bnro.ro
};

// Backup BNR XML URL (no longer used as primary, keeping for reference)
const BNR_XML_URL = 'https://www.bnr.ro/nbrfxrates.xml';

export class BnrExchangeRateService {
  private httpClient: HttpClient;
  
  constructor() {
    this.httpClient = createHttpClient({
      timeout: 10000,
    });
  }
  
  /**
   * Get drizzle db instance
   */
  private get db() {
    return Services.db;
  }
  
  /**
   * Initialize the BNR exchange rate service with cron jobs
   */
  initialize(): void {
    // Schedule the job to run every 3 hours, with an additional check at 14:30 Romania time (BNR update time)
    cron.schedule('0 */3 * * *', async () => {
      try {
        await this.fetchAndStoreRatesFromRss();
        console.log('🔄 Scheduled BNR exchange rate update (RSS) completed successfully', 'bnr-exchange');
      } catch (error) {
        console.log(`❌ Scheduled BNR exchange rate update (RSS) failed: ${(error as Error).message}`, 'bnr-exchange');
        // No fallback to XML as per requirements to use only RSS feeds
      }
    }, {
      timezone: 'Europe/Bucharest'
    });
    
    // Special check at 14:30 when BNR typically updates rates
    cron.schedule('30 14 * * *', async () => {
      try {
        await this.fetchAndStoreRatesFromRss();
        console.log('🔄 BNR daily update check (14:30) completed successfully', 'bnr-exchange');
      } catch (error) {
        console.log(`❌ BNR daily update check failed: ${(error as Error).message}`, 'bnr-exchange');
        // No fallback to XML as per requirements to use only RSS feeds
      }
    }, {
      timezone: 'Europe/Bucharest'
    });
    
    console.log('📅 BNR exchange rate sync scheduled every 3 hours and at 14:30 Romania time (using only RSS feeds)', 'bnr-exchange');
  }
  
  /**
   * Fetch rates from RSS feeds for specific currencies including historical data
   */
  async fetchAndStoreRatesFromRss(): Promise<void> {
    try {
      console.log('🌐 Fetching exchange rates from BNR RSS feeds (including historical data)...', 'bnr-exchange');
      
      const currencies = Object.keys(BNR_CURRENCY_RSS_FEEDS);
      let totalRatesStored = 0;
      let successfulCurrencies = 0;
      
      // Process each currency RSS feed
      for (const currency of currencies) {
        try {
          const feedUrl = BNR_CURRENCY_RSS_FEEDS[currency as keyof typeof BNR_CURRENCY_RSS_FEEDS];
          console.log(`📡 Fetching RSS feed for ${currency}: ${feedUrl}`, 'bnr-exchange');
          
          const response = await this.httpClient.get(feedUrl, {
            responseType: 'text',
            timeout: 15000,
            headers: {
              'Accept': 'application/xml, text/xml, */*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          // Parse RSS XML response
          const parsed = await parseStringPromise(response);
          
          if (!parsed || !parsed.rss || !parsed.rss.channel || !parsed.rss.channel[0] || 
              !parsed.rss.channel[0].item || !parsed.rss.channel[0].item.length) {
            console.log(`⚠️ Invalid RSS structure for ${currency}`, 'bnr-exchange');
            continue;
          }
          
          // Get all items (includes historical data, not just latest)
          const items = parsed.rss.channel[0].item;
          console.log(`📊 Found ${items.length} historical items in RSS feed for ${currency}`, 'bnr-exchange');
          
          let currencyRatesStored = 0;
          
          // Process each item (each represents a day's rate)
          for (const item of items) {
            try {
              const title = item.title?.[0] || '';
              const pubDate = item.pubDate?.[0] || '';
              
              // Extract rate from title (format: "1 EUR = 4.9775 RON 09-04-2025 Curs de schimb BNR")
              const rateMatch = title.match(/1\s+\w+\s+=\s+(\d+(?:\.\d+)?)\s+RON/);
              
              if (!rateMatch) {
                console.log(`⚠️ Could not extract rate from title: "${title}" for ${currency}`, 'bnr-exchange');
                continue;
              }
              
              const rateValue = parseFloat(rateMatch[1]);
              
              // Parse the date from RSS pubDate format
              const date = new Date(pubDate);
              
              // Format date string for debugging
              const dateStr = date.toISOString().split('T')[0];
              
              // Store the rate in database
              await this.db.insert(fx_rates).values({
                currency,
                rate: rateValue.toString(),
                source: 'BNR_RSS',
                baseCurrency: 'RON',
                date
              }).onConflictDoUpdate({
                target: [fx_rates.currency, fx_rates.date, fx_rates.source, fx_rates.baseCurrency],
                set: { rate: rateValue.toString(), updatedAt: new Date() }
              });
              
              currencyRatesStored++;
              totalRatesStored++;
              
              // Only log the most recent rate to avoid flooding the logs
              if (currencyRatesStored === 1) {
                console.log(`✅ Stored latest RSS rate for ${currency}: ${rateValue} (${dateStr})`, 'bnr-exchange');
              }
            } catch (itemError) {
              console.log(`⚠️ Error processing RSS item for ${currency}: ${(itemError as Error).message}`, 'bnr-exchange');
            }
          }
          
          // Log summary for this currency
          if (currencyRatesStored > 0) {
            successfulCurrencies++;
            console.log(`📊 Stored ${currencyRatesStored} historical rates for ${currency} from RSS feed`, 'bnr-exchange');
          } else {
            console.log(`❌ Failed to store any rates for ${currency} from RSS feed`, 'bnr-exchange');
          }
        } catch (currencyError) {
          console.log(`❌ Error processing RSS feed for ${currency}: ${(currencyError as Error).message}`, 'bnr-exchange');
        }
      }
      
      if (successfulCurrencies === 0) {
        throw new Error('Failed to process any RSS feeds successfully');
      }
      
      console.log(`✅ Successfully stored ${totalRatesStored} BNR exchange rates from ${successfulCurrencies}/${currencies.length} RSS feeds`, 'bnr-exchange');
    } catch (error) {
      console.log(`❌ Error fetching BNR exchange rates from RSS: ${(error as Error).message}`, 'bnr-exchange');
      throw new Error(`Failed to fetch and store BNR exchange rates from RSS: ${(error as Error).message}`);
    }
  }
  
  /**
   * Fetch rates from the BNR XML feed
   */
  async fetchAndStoreRatesFromXml(): Promise<void> {
    try {
      console.log('🌐 Fetching exchange rates from BNR XML feed...', 'bnr-exchange');
      
      const response = await this.httpClient.get(BNR_XML_URL, {
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
      
      console.log(`📊 Processing ${rates.length} exchange rates from BNR XML for date ${dateStr}`, 'bnr-exchange');
      
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
      
      console.log(`✅ Successfully stored ${rates.length} BNR exchange rates in database from XML`, 'bnr-exchange');
    } catch (error) {
      console.log(`❌ Error fetching BNR exchange rates from XML: ${(error as Error).message}`, 'bnr-exchange');
      throw new Error(`Failed to fetch and store BNR exchange rates from XML: ${(error as Error).message}`);
    }
  }
  
  /**
   * Main method to fetch and store rates - using only RSS feeds as requested
   */
  async fetchAndStoreRates(): Promise<void> {
    try {
      // Use RSS method as primary source as requested
      await this.fetchAndStoreRatesFromRss();
      console.log('✅ RSS method completed successfully', 'bnr-exchange');
    } catch (error) {
      console.log(`❌ RSS method failed: ${(error as Error).message}`, 'bnr-exchange');
      throw new Error(`Failed to fetch exchange rates from RSS: ${(error as Error).message}`);
    }
  }
  
  /**
   * Get the latest BNR exchange rates from the database
   * If no rates are found, fetches from BNR and stores them
   */
  async getLatestRates(): Promise<Record<string, number>> {
    try {
      // Try to get the latest rates from the database (prioritize RSS, then fallback to BNR)
      const allRates = await this.db.select()
        .from(fx_rates)
        .where(
          eq(fx_rates.baseCurrency, 'RON')
        )
        .orderBy(desc(fx_rates.date))
        .limit(200);
      
      // If no rates in DB, fetch from sources
      if (!allRates || allRates.length === 0) {
        console.log('🔄 No exchange rates found in database, fetching from sources...', 'bnr-exchange');
        await this.fetchAndStoreRates();
        return this.getLatestRates(); // Retry after fetching
      }
      
      // Process rates giving priority to BNR_RSS source
      const ratesObject: Record<string, number> = {};
      const processedCurrencies = new Set<string>();
      
      // First check for RSS rates
      for (const rate of allRates) {
        if (rate.source === 'BNR_RSS' && !processedCurrencies.has(rate.currency)) {
          ratesObject[rate.currency] = parseFloat(rate.rate.toString());
          processedCurrencies.add(rate.currency);
        }
      }
      
      // Then add any missing rates from BNR source
      for (const rate of allRates) {
        if (rate.source === 'BNR' && !processedCurrencies.has(rate.currency)) {
          ratesObject[rate.currency] = parseFloat(rate.rate.toString());
          processedCurrencies.add(rate.currency);
        }
      }
      
      // Finally add any other rates
      for (const rate of allRates) {
        if (!processedCurrencies.has(rate.currency)) {
          ratesObject[rate.currency] = parseFloat(rate.rate.toString());
          processedCurrencies.add(rate.currency);
        }
      }
      
      console.log(`📈 Retrieved ${Object.keys(ratesObject).length} exchange rates from database (combined sources)`, 'bnr-exchange');
      return ratesObject;
    } catch (error) {
      console.log(`❌ Error getting exchange rates: ${(error as Error).message}`, 'bnr-exchange');
      throw new Error(`Failed to get exchange rates: ${(error as Error).message}`);
    }
  }
  
  /**
   * Manually trigger a fetch of BNR rates from RSS feeds
   * Useful for testing or initial setup
   */
  async manualFetch(): Promise<Record<string, number>> {
    console.log('🔍 Starting manual BNR exchange rate update from RSS feeds...', 'bnr-exchange');
    
    try {
      // Process each RSS feed for available currencies
      console.log('🔍 Fetching RSS feeds for all configured currencies...', 'bnr-exchange');
      const currencies = Object.keys(BNR_CURRENCY_RSS_FEEDS);
      
      // Test individual RSS feed connections first (for debugging)
      for (const currency of currencies) {
        try {
          const feedUrl = BNR_CURRENCY_RSS_FEEDS[currency as keyof typeof BNR_CURRENCY_RSS_FEEDS];
          console.log(`🔍 Testing RSS feed URL for ${currency}: ${feedUrl}`, 'bnr-exchange');
          
          const response = await this.httpClient.get(feedUrl, {
            responseType: 'text',
            timeout: 15000,
            headers: {
              'Accept': 'application/xml, text/xml, */*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          console.log(`✅ Successfully fetched RSS feed for ${currency}. Response length: ${response.length}`, 'bnr-exchange');
        } catch (urlError) {
          console.log(`⚠️ Failed to fetch RSS feed for ${currency}: ${(urlError as Error).message}`, 'bnr-exchange');
        }
      }
      
      // Now store all rates from RSS feeds
      try {
        await this.fetchAndStoreRatesFromRss();
        console.log('✅ Manual RSS feed update completed successfully', 'bnr-exchange');
      } catch (rssError) {
        console.log(`❌ RSS feed update failed: ${(rssError as Error).message}`, 'bnr-exchange');
        throw rssError; // Re-throw as this is our primary method now
      }
    } catch (error) {
      console.log(`❌ Manual exchange rate update failed: ${(error as Error).message}`, 'bnr-exchange');
      throw new Error(`Failed to manually fetch exchange rates from RSS: ${(error as Error).message}`);
    }
    
    return this.getLatestRates();
  }
  
  /**
   * Get the RSS feeds URLs for currencies
   */
  getRssFeeds(): Record<string, string> {
    return { ...BNR_CURRENCY_RSS_FEEDS };
  }
  
  /**
   * Get the exchange rate for a specific currency
   */
  async getRateForCurrency(currency: string): Promise<number | null> {
    try {
      // First try to get the latest rate for this specific currency
      const results = await this.db.select()
        .from(fx_rates)
        .where(and(
          eq(fx_rates.currency, currency),
          eq(fx_rates.baseCurrency, 'RON')
        ))
        .orderBy(desc(fx_rates.date))
        .limit(10);
      
      if (results && results.length > 0) {
        // Try to find RSS source first (preferred)
        const rssRate = results.find((r: { source: string; rate: any }) => r.source === 'BNR_RSS');
        if (rssRate) {
          return parseFloat(rssRate.rate.toString());
        }
        
        // Then try BNR source
        const bnrRate = results.find((r: { source: string; rate: any }) => r.source === 'BNR');
        if (bnrRate) {
          return parseFloat(bnrRate.rate.toString());
        }
        
        // Fallback to first available rate
        return parseFloat(results[0].rate.toString());
      }
      
      // If no specific rate found, fetch all rates and check
      const rates = await this.getLatestRates();
      return rates[currency] || null;
    } catch (error) {
      console.log(`❌ Error getting rate for ${currency}: ${(error as Error).message}`, 'bnr-exchange');
      throw new Error(`Failed to get rate for ${currency}: ${(error as Error).message}`);
    }
  }
}

// Create singleton instance
export const bnrExchangeRateService = new BnrExchangeRateService();