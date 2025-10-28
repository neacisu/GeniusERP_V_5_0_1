/**
 * Currency Service
 * 
 * This service provides conversion between currencies using locally stored BNR rates.
 * It connects to the database and uses the latest available exchange rates.
 */

import { eq, and, desc } from 'drizzle-orm';
import { fx_rates } from '@geniuserp/shared';
import { getDrizzle } from "@common/drizzle";

export class CurrencyService {
  /**
   * Convert an amount between currencies using stored BNR exchange rates
   * 
   * @param amount The amount to convert
   * @param from Source currency code (e.g., 'RON', 'EUR')
   * @param to Target currency code
   * @returns The converted amount with 2 decimal precision
   */
  static async convert(amount: number, from: string, to: string): Promise<number> {
    // If source and target currencies are the same, return the original amount
    if (from === to) return amount;

    try {
      const today = new Date();
      
      // Get the rates for both currencies (relative to RON)
      const rateFrom = from === 'RON' ? 1 : await this.getRate(from, today);
      const rateTo = to === 'RON' ? 1 : await this.getRate(to, today);

      if (!rateFrom || !rateTo) {
        throw new Error(`Missing exchange rate for ${from} or ${to}`);
      }

      // Convert to RON first (if needed), then to target currency
      const ronAmount = from === 'RON' ? amount : amount * rateFrom;
      const converted = to === 'RON' ? ronAmount : ronAmount / rateTo;

      console.log(`💱 Converted ${amount} ${from} to ${converted.toFixed(2)} ${to} using BNR rates`, 'currency');
      return parseFloat(converted.toFixed(2));
    } catch (error) {
      console.log(`❌ Error converting currency: ${(error as Error).message}`, 'currency');
      throw new Error(`Failed to convert currency: ${(error as Error).message}`);
    }
  }

  /**
   * Get the latest exchange rate for a currency
   * 
   * @param currency The currency code (e.g., 'EUR', 'USD')
   * @param date The reference date (defaults to today)
   * @returns The exchange rate value or null if not found
   */
  static async getRate(currency: string, date: Date = new Date()): Promise<number | null> {
    try {
      const db = getDrizzle();

      // Query the latest rates for the currency from all sources
      const result = await db
        .select({ 
          rate: fx_rates.rate,
          source: fx_rates.source,
          date: fx_rates.date
        })
        .from(fx_rates)
        .where(and(
          eq(fx_rates.currency, currency),
          eq(fx_rates.baseCurrency, 'RON')
        ))
        .orderBy(desc(fx_rates.date));

      if (!result.length) {
        console.log(`⚠️ No exchange rate found for ${currency}`, 'currency');
        return null;
      }

      // Try to find an RSS source first (more reliable)
      const rssRate = result.find((r: { source: string; rate: any }) => r.source === 'BNR_RSS');
      if (rssRate) {
        const rate = parseFloat(rssRate.rate.toString());
        console.log(`📊 Retrieved RSS rate for ${currency}: ${rate}`, 'currency');
        return rate;
      }

      // Fallback to BNR source if no RSS rate is available
      const bnrRate = result.find((r: { source: string; rate: any }) => r.source === 'BNR');
      if (bnrRate) {
        const rate = parseFloat(bnrRate.rate.toString());
        console.log(`📊 Retrieved BNR rate for ${currency}: ${rate}`, 'currency');
        return rate;
      }

      // If no preferred sources found, use the first available rate
      const rate = parseFloat(result[0].rate.toString());
      console.log(`📊 Retrieved fallback rate for ${currency}: ${rate}`, 'currency');
      return rate;
    } catch (error) {
      console.log(`❌ Error getting exchange rate: ${(error as Error).message}`, 'currency');
      return null;
    }
  }

  /**
   * Get available exchange rates for a specific date
   * 
   * @param date The reference date (defaults to today)
   * @returns Object with currency codes as keys and rates as values
   */
  static async getRates(date: Date = new Date()): Promise<Record<string, number>> {
    try {
      const db = getDrizzle();

      // Format date to exclude time components for comparison
      const formattedDate = new Date(date);
      formattedDate.setHours(0, 0, 0, 0);

      // Get the range for the specified date (start/end of day)
      const startOfDay = new Date(formattedDate);
      const endOfDay = new Date(formattedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Query rates from both BNR and BNR_RSS sources, prioritizing BNR_RSS
      const result = await db
        .select({
          currency: fx_rates.currency,
          rate: fx_rates.rate,
          source: fx_rates.source,
          date: fx_rates.date
        })
        .from(fx_rates)
        .where(
          and(
            eq(fx_rates.baseCurrency, 'RON')
          )
        )
        .orderBy(desc(fx_rates.date));
      
      // Process results by source and date, giving priority to RSS source
      const rates: Record<string, number> = {};
      const usedCurrencies = new Set<string>();
      
      // First process any BNR_RSS source rates (higher priority)
      for (const row of result) {
        // If we already have this currency from a better source, skip
        if (usedCurrencies.has(row.currency)) continue;
        
        // Check if this is from RSS source
        if (row.source === 'BNR_RSS') {
          rates[row.currency] = parseFloat(row.rate.toString());
          usedCurrencies.add(row.currency);
        }
      }
      
      // Then process any regular BNR source rates
      for (const row of result) {
        // If we already have this currency, skip
        if (usedCurrencies.has(row.currency)) continue;
        
        // Check if this is from regular BNR source
        if (row.source === 'BNR') {
          rates[row.currency] = parseFloat(row.rate.toString());
          usedCurrencies.add(row.currency);
        }
      }

      console.log(`📈 Retrieved ${Object.keys(rates).length} exchange rates (combined sources)`, 'currency');
      return rates;
    } catch (error) {
      console.log(`❌ Error getting exchange rates: ${(error as Error).message}`, 'currency');
      return {};
    }
  }
}