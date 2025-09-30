/**
 * BNR RSS Feeds Test Script
 * 
 * This script tests connectivity to the BNR RSS feeds for
 * exchange rates (EUR, USD, TRY).
 */

import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// The specific RSS feeds we want to use
const BNR_CURRENCY_RSS_FEEDS = {
  EUR: 'https://www.bnro.ro/RSS_200003_EUR.aspx',
  USD: 'https://www.bnro.ro/RSS_200004_USD.aspx',
  TRY: 'https://www.bnro.ro/RSS_200023_TRY.aspx'
};

// Advanced HTTP client with retry logic
const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 300) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      timeout: 15000,
      responseType: 'text',
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      ...options
    });
    
    return response.data;
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Retry attempt for ${url}, retries left: ${retries-1}`);
    await new Promise(resolve => setTimeout(resolve, backoff));
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
};

// Parse RSS data for exchange rates
const parseRssData = async (xmlData, currency) => {
  try {
    const parsed = await parseStringPromise(xmlData);
    
    if (!parsed || !parsed.rss || !parsed.rss.channel || !parsed.rss.channel[0] || 
        !parsed.rss.channel[0].item || !parsed.rss.channel[0].item.length) {
      throw new Error(`Invalid RSS structure for ${currency}`);
    }
    
    // Get all items (includes historical data, not just latest)
    const items = parsed.rss.channel[0].item;
    console.log(`Found ${items.length} historical items in RSS feed for ${currency}`);
    
    const rates = [];
    
    // Process each item (each represents a day's rate)
    for (const item of items) {
      try {
        const title = item.title?.[0] || '';
        const pubDate = item.pubDate?.[0] || '';
        
        // Extract rate from title (format: "1 EUR = 4.9775 RON 09-04-2025 Curs de schimb BNR")
        const rateMatch = title.match(/1\s+\w+\s+=\s+(\d+(?:\.\d+)?)\s+RON/);
        
        if (!rateMatch) {
          console.log(`Could not extract rate from title: "${title}" for ${currency}`);
          continue;
        }
        
        const rateValue = parseFloat(rateMatch[1]);
        const date = new Date(pubDate);
        
        rates.push({
          currency,
          rate: rateValue,
          date: date.toISOString().split('T')[0]
        });
      } catch (itemError) {
        console.error(`Error processing RSS item for ${currency}:`, itemError.message);
      }
    }
    
    return rates;
  } catch (error) {
    console.error(`Error parsing RSS data for ${currency}:`, error.message);
    throw error;
  }
};

// Test each RSS feed
const testRssFeeds = async () => {
  console.log('🔍 Testing BNR RSS feeds...');
  const results = {};
  
  for (const [currency, url] of Object.entries(BNR_CURRENCY_RSS_FEEDS)) {
    console.log(`\n📡 Testing ${currency} RSS feed: ${url}`);
    
    try {
      console.log(`Fetching RSS feed for ${currency}...`);
      const data = await fetchWithRetry(url);
      console.log(`✅ Successfully fetched RSS feed for ${currency}. Response length: ${data.length} characters`);
      
      if (data.length < 100) {
        console.log(`⚠️ Warning: Response for ${currency} seems too short (${data.length} chars). Content preview:`, data);
      }
      
      // Try to parse the RSS data
      console.log(`Parsing RSS data for ${currency}...`);
      const rates = await parseRssData(data, currency);
      console.log(`✅ Successfully parsed RSS feed for ${currency}. Found ${rates.length} rates.`);
      
      if (rates.length > 0) {
        console.log(`Latest rate for ${currency}: ${rates[0].rate} RON (${rates[0].date})`);
      }
      
      results[currency] = {
        success: true,
        url,
        ratesCount: rates.length,
        latestRate: rates.length > 0 ? rates[0] : null
      };
    } catch (error) {
      console.error(`❌ Error testing RSS feed for ${currency}:`, error.message);
      results[currency] = {
        success: false,
        url,
        error: error.message
      };
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  for (const [currency, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`✅ ${currency}: Success - Found ${result.ratesCount} rates`);
    } else {
      console.log(`❌ ${currency}: Failed - ${result.error}`);
    }
  }
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\nSuccess rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  return results;
};

// Execute the test
testRssFeeds()
  .then(() => {
    console.log('\n✅ Test completed.');
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
  });