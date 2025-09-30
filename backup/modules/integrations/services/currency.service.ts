/**
 * Currency Service
 * 
 * This service provides conversion between currencies using locally stored BNR rates.
 * It connects to the database and uses the latest available exchange rates.
 */

import { eq, and, desc } from 'drizzle-orm';
import { fx_rates } from '@shared/schema';
import { getDrizzle } from '../../../common/drizzle';
import { log } from '../../../vite';

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

      log(`💱 Converted ${amount} ${from} to ${converted.toFixed(2)} ${to} using BNR rates`, 'currency');
      return parseFloat(converted.toFixed(2));
    } catch (error) {
      log(`❌ Error converting currency: ${(error as Error).message}`, 'currency');
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

      // Query the latest rate for the currency
      const result = await db
        .select({ rate: fx_rates.rate })
        .from(fx_rates)
        .where(and(
          eq(fx_rates.currency, currency),
          eq(fx_rates.baseCurrency, 'RON')
        ))
        .orderBy(desc(fx_rates.date))
        .limit(1);

      if (!result.length) {
        log(`⚠️ No exchange rate found for ${currency}`, 'currency');
        return null;
      }

      // Convert the numeric result to a float
      const rate = parseFloat(result[0].rate.toString());
      log(`📊 Retrieved rate for ${currency}: ${rate}`, 'currency');
      return rate;
    } catch (error) {
      log(`❌ Error getting exchange rate: ${(error as Error).message}`, 'currency');
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

      // Format date to exclude time
      const formattedDate = new Date(date);
      formattedDate.setHours(0, 0, 0, 0);

      // Query all rates for the specified date
      const result = await db
        .select({
          currency: fx_rates.currency,
          rate: fx_rates.rate
        })
        .from(fx_rates)
        .where(and(
          eq(fx_rates.date, formattedDate),
          eq(fx_rates.baseCurrency, 'RON')
        ));

      // Convert to a key-value object with currencies as keys
      const rates: Record<string, number> = {};
      for (const row of result) {
        rates[row.currency] = parseFloat(row.rate.toString());
      }

      log(`📈 Retrieved ${Object.keys(rates).length} exchange rates for ${formattedDate.toISOString().split('T')[0]}`, 'currency');
      return rates;
    } catch (error) {
      log(`❌ Error getting exchange rates: ${(error as Error).message}`, 'currency');
      return {};
    }
  }
}