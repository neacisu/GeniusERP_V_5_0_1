/**
 * BNR Exchange Rate Update Script
 * 
 * This script triggers a BNR exchange rate update directly using the service
 * and then checks the database for results
 */

import pg from 'pg';
import { bnrExchangeRateService } from './server/modules/integrations/services/bnr-exchange-rate.service.js';

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkRates() {
  console.log('🔍 Checking BNR exchange rates in database...');
  
  try {
    // Trigger a manual update using the service
    console.log('🔄 Triggering BNR exchange rate update through the service...');
    await bnrExchangeRateService.manualFetch();
    console.log('✅ Manual update completed');
    
    // Query the database to verify results
    console.log('\n📊 Checking rates in database...');
    const client = await pool.connect();
    
    try {
      // Count rates by source
      const countResult = await client.query(`
        SELECT source, COUNT(*) as count
        FROM fx_rates
        GROUP BY source
        ORDER BY count DESC
      `);
      
      console.log('Rate counts by source:');
      countResult.rows.forEach(row => {
        console.log(`${row.source}: ${row.count} rates`);
      });
      
      // Count rates by currency
      const currencyResult = await client.query(`
        SELECT currency, COUNT(*) as count
        FROM fx_rates
        GROUP BY currency
        ORDER BY count DESC
      `);
      
      console.log('\nRate counts by currency:');
      currencyResult.rows.forEach(row => {
        console.log(`${row.currency}: ${row.count} rates`);
      });
      
      // Get the latest rates
      const latestResult = await client.query(`
        SELECT DISTINCT ON (currency) currency, rate, date, source
        FROM fx_rates
        ORDER BY currency, date DESC
      `);
      
      console.log('\nLatest exchange rates:');
      latestResult.rows.forEach(row => {
        console.log(`${row.currency}: ${row.rate} RON (${row.date.toISOString().split('T')[0]}, source: ${row.source})`);
      });
      
    } finally {
      client.release();
    }
    
    console.log('\n✅ Check completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

// Run the check
checkRates();