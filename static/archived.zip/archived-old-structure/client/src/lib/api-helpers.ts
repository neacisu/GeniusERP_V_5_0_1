/**
 * API Helper functions
 */

/**
 * Fetch exchange rates from the BNR API with proper headers
 * @returns Promise with exchange rate data
 */
export async function fetchExchangeRates() {
  try {
    const response = await fetch('/api/exchange-rates/bnr/all', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (err) {
    console.error('Error fetching exchange rates:', err);
    throw err;
  }
}

/**
 * Fetch historical exchange rates for the given currencies
 * @param currencies Array of currency codes to fetch (default: USD, EUR, TRY)
 * @param days Number of days of history to fetch (default: 10)
 * @param source Source of data (optional, can be 'BNR', 'BNR_RSS', etc.)
 * @returns Promise with historical exchange rate data
 */
export async function fetchHistoricalExchangeRates(
  currencies: string[] = ['USD', 'EUR', 'TRY'], 
  days: number = 10,
  source?: string
) {
  try {
    const currenciesParam = currencies.join(',');
    const sourceParam = source ? `&source=${source}` : '';
    
    const response = await fetch(
      `/api/exchange-rates/historical?currencies=${currenciesParam}&days=${days}${sourceParam}`, 
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (err) {
    console.error('Error fetching historical exchange rates:', err);
    throw err;
  }
}

/**
 * Manually trigger BNR exchange rates update
 * @returns Promise with update result
 */
export async function refreshExchangeRates() {
  try {
    const response = await fetch('/api/exchange-rates/bnr/update', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (err) {
    console.error('Error updating exchange rates:', err);
    throw err;
  }
}