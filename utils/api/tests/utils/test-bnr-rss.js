/**
 * Test BNR RSS Feeds Directly
 * 
 * This script tests the BNR RSS feeds directly to validate if they're working.
 */

import https from 'https';
import { parseString } from 'xml2js';

// Currency RSS feed URLs
const BNR_CURRENCY_RSS_FEEDS = {
  EUR: 'https://www.bnr.ro/RSS_200003_EUR.aspx',
  USD: 'https://www.bnr.ro/RSS_200004_USD.aspx',
  TRY: 'https://www.bnr.ro/RSS_200023_TRY.aspx'
};

// XML feed for comparison
const BNR_XML_URL = 'https://www.bnr.ro/nbrfxrates.xml';

/**
 * Make an HTTPS request with proper headers
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    };

    const req = https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        console.log(`Redirect received for ${url} -> ${res.headers.location}`);
        return makeRequest(res.headers.location)
          .then(resolve)
          .catch(reject);
      }

      console.log(`Status code for ${url}: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers)}`);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });

    req.end();
  });
}

/**
 * Test all RSS feeds
 */
async function testRssFeeds() {
  console.log('🔍 Testing BNR RSS feeds...');
  
  const results = {};
  
  // Test each RSS feed
  for (const [currency, url] of Object.entries(BNR_CURRENCY_RSS_FEEDS)) {
    try {
      console.log(`🔍 Testing RSS feed for ${currency}: ${url}`);
      const response = await makeRequest(url);
      
      console.log(`✅ Response length for ${currency}: ${response.length}`);
      
      // Try to parse XML
      try {
        parseString(response, (err, result) => {
          if (err) {
            console.error(`❌ XML parse error for ${currency}: ${err.message}`);
            return;
          }
          
          console.log(`✅ XML parsed successfully for ${currency}`);
          
          if (result && result.rss && result.rss.channel && result.rss.channel[0] && 
              result.rss.channel[0].item && result.rss.channel[0].item.length) {
            
            const items = result.rss.channel[0].item;
            console.log(`📊 Found ${items.length} items in RSS feed for ${currency}`);
            
            // Show first item as example
            if (items.length > 0) {
              console.log(`📝 First item title: ${items[0].title?.[0] || 'N/A'}`);
              console.log(`📅 First item date: ${items[0].pubDate?.[0] || 'N/A'}`);
            }
          } else {
            console.log(`⚠️ RSS feed for ${currency} has unexpected structure`);
          }
        });
      } catch (parseErr) {
        console.error(`❌ Failed to parse XML for ${currency}: ${parseErr.message}`);
      }
      
      results[currency] = {
        success: true,
        responseLength: response.length
      };
    } catch (error) {
      console.error(`❌ Error fetching RSS feed for ${currency}: ${error.message}`);
      
      results[currency] = {
        success: false,
        error: error.message
      };
    }
  }
  
  // Test the XML feed
  try {
    console.log(`\n🔍 Testing BNR XML feed: ${BNR_XML_URL}`);
    const response = await makeRequest(BNR_XML_URL);
    
    console.log(`✅ XML feed response length: ${response.length}`);
    
    // Try to parse XML
    try {
      parseString(response, (err, result) => {
        if (err) {
          console.error(`❌ XML parse error for BNR XML feed: ${err.message}`);
          return;
        }
        
        console.log(`✅ XML parsed successfully for BNR XML feed`);
        
        if (result && result.DataSet && result.DataSet.Body && result.DataSet.Body[0] && 
            result.DataSet.Body[0].Cube && result.DataSet.Body[0].Cube[0] && 
            result.DataSet.Body[0].Cube[0].Rate) {
          
          const rates = result.DataSet.Body[0].Cube[0].Rate;
          const dateStr = result.DataSet.Body[0].Cube[0].$.date;
          
          console.log(`📊 Found ${rates.length} rates in XML feed for date ${dateStr}`);
          
          // Show first 3 rates as examples
          if (rates.length > 0) {
            for (let i = 0; i < Math.min(3, rates.length); i++) {
              console.log(`💱 ${rates[i].$.currency}: ${rates[i]._}`);
            }
          }
        } else {
          console.log(`⚠️ BNR XML feed has unexpected structure`);
        }
      });
    } catch (parseErr) {
      console.error(`❌ Failed to parse XML for BNR XML feed: ${parseErr.message}`);
    }
    
    results.xml = {
      success: true,
      responseLength: response.length
    };
  } catch (error) {
    console.error(`❌ Error fetching BNR XML feed: ${error.message}`);
    
    results.xml = {
      success: false,
      error: error.message
    };
  }
  
  console.log('\n📋 Test Summary:');
  console.log(JSON.stringify(results, null, 2));
}

// Run the test
testRssFeeds();