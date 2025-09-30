/**
 * Test BNR XML Feed Directly
 * 
 * This script tests the BNR XML feed directly to validate if it's working.
 */

import https from 'https';
import { parseString } from 'xml2js';

// XML feed URL
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
 * Test the BNR XML feed
 */
async function testXmlFeed() {
  console.log('🔍 Testing BNR XML feed...');
  
  try {
    console.log(`🔍 Testing BNR XML feed: ${BNR_XML_URL}`);
    const response = await makeRequest(BNR_XML_URL);
    
    console.log(`✅ XML feed response length: ${response.length}`);
    console.log(`\nXML content (first 500 chars):\n${response.substring(0, 500)}...\n`);
    
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
          
          // Show all rates 
          console.log('\n📋 All exchange rates:');
          for (let i = 0; i < rates.length; i++) {
            console.log(`💱 ${rates[i].$.currency}: ${rates[i]._}`);
          }
        } else {
          console.log(`⚠️ BNR XML feed has unexpected structure`);
        }
      });
    } catch (parseErr) {
      console.error(`❌ Failed to parse XML for BNR XML feed: ${parseErr.message}`);
    }
  } catch (error) {
    console.error(`❌ Error fetching BNR XML feed: ${error.message}`);
  }
}

// Run the test
testXmlFeed();