/**
 * Exchange Rate Service
 * 
 * This service provides currency exchange rate functionality using external APIs.
 * Used for converting between currencies in invoices, reports, and financial statements.
 */

import { createHttpClient, HttpClient } from '@geniuserp/shared/libs/http-client';

interface ExchangeRateResponse {
  result: string;
  provider: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  time_eol_unix: number;
  base_code: string;
  rates: Record<string, number>;
}

export interface ExchangeRateConfig {
  apiBaseUrl?: string;
  apiKey?: string;
  baseCurrency?: string;
}

export class ExchangeRateService {
  private httpClient: HttpClient;
  private baseCurrency: string;

  constructor(config: ExchangeRateConfig = {}) {
    this.baseCurrency = config.baseCurrency || 'RON'; // Romanian Leu as default
    
    this.httpClient = createHttpClient({
      baseURL: config.apiBaseUrl || 'https://open.er-api.com/v6',
      timeout: 10000,
      headers: {
        ...(config.apiKey ? { 'apikey': config.apiKey } : {})
      }
    });
  }

  /**
   * Get latest exchange rates with RON as base currency
   */
  async getLatestRates(baseCurrency: string = this.baseCurrency): Promise<Record<string, number>> {
    try {
      console.log(`📊 Fetching latest exchange rates with base currency: ${baseCurrency}`, 'exchange-rate');
      
      const response = await this.httpClient.get<ExchangeRateResponse>(`/latest/${baseCurrency}`);
      
      if (!response || response.result !== 'success') {
        throw new Error('Failed to fetch exchange rates');
      }
      
      console.log(`✅ Successfully fetched exchange rates for ${Object.keys(response.rates).length} currencies`, 'exchange-rate');
      return response.rates;
    } catch (error) {
      console.log(`❌ Error fetching exchange rates: ${(error as Error).message}`, 'exchange-rate');
      throw new Error(`Failed to fetch exchange rates: ${(error as Error).message}`);
    }
  }

  /**
   * Get historical exchange rate for a specific date
   */
  async getHistoricalRate(date: string, from: string = this.baseCurrency, to: string = 'EUR'): Promise<number> {
    try {
      console.log(`📊 Fetching historical exchange rate for ${from} to ${to} on ${date}`, 'exchange-rate');
      
      // Format date as YYYY-MM-DD
      const formattedDate = new Date(date).toISOString().split('T')[0];
      
      const response = await this.httpClient.get<ExchangeRateResponse>(`/${formattedDate}/${from}`);
      
      if (!response || response.result !== 'success' || !response.rates[to]) {
        throw new Error(`Failed to fetch historical exchange rate for ${to}`);
      }
      
      return response.rates[to];
    } catch (error) {
      console.log(`❌ Error fetching historical exchange rate: ${(error as Error).message}`, 'exchange-rate');
      throw new Error(`Failed to fetch historical exchange rate: ${(error as Error).message}`);
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(amount: number, from: string = this.baseCurrency, to: string = 'EUR'): Promise<number> {
    try {
      const rates = await this.getLatestRates(from);
      
      if (!rates[to]) {
        throw new Error(`Exchange rate not available for ${to}`);
      }
      
      const convertedAmount = amount * rates[to];
      console.log(`💱 Converted ${amount} ${from} to ${convertedAmount.toFixed(2)} ${to}`, 'exchange-rate');
      
      return convertedAmount;
    } catch (error) {
      console.log(`❌ Error converting currency: ${(error as Error).message}`, 'exchange-rate');
      throw new Error(`Failed to convert currency: ${(error as Error).message}`);
    }
  }

  /**
   * Get the BNR (Romanian National Bank) reference exchange rate
   * This is often required for Romanian accounting documents
   */
  async getBNRReferenceRate(date?: string): Promise<Record<string, number>> {
    // In a real implementation, this would connect to BNR's API
    // For now, we'll use our regular service as a placeholder
    try {
      const formattedDate = date || new Date().toISOString().split('T')[0];
      console.log(`📊 Fetching BNR reference exchange rate for ${formattedDate}`, 'exchange-rate');
      
      // Just use the latest rates endpoint since the historical endpoint isn't reliably working
      const response = await this.httpClient.get<ExchangeRateResponse>(`/latest/RON`);
      
      if (!response || response.result !== 'success') {
        throw new Error('Failed to fetch BNR reference exchange rate');
      }
      
      // Filter for commonly used currencies in Romanian accounting
      const relevantCurrencies = ['EUR', 'USD', 'GBP', 'CHF'];
      const filteredRates: Record<string, number> = {};
      
      for (const currency of relevantCurrencies) {
        if (response.rates[currency]) {
          filteredRates[currency] = response.rates[currency];
        }
      }
      
      return filteredRates;
    } catch (error) {
      console.log(`❌ Error fetching BNR reference rate: ${(error as Error).message}`, 'exchange-rate');
      throw new Error(`Failed to fetch BNR reference rate: ${(error as Error).message}`);
    }
  }
}

// Create a default instance for common use
export const exchangeRateService = new ExchangeRateService();