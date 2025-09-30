/**
 * BNR Exchange Rate Widget
 * 
 * This component displays current exchange rates for USD, EUR, and TRY
 * along with a 10-day trend chart and a refresh button.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Define the interface for exchange rate data
interface ExchangeRate {
  currency: string;
  rate: number;
  change: number;
  color: string;
}

// Define interface for historical rates
interface HistoricalRate {
  date: string;
  USD: number;
  EUR: number;
  TRY: number;
}

export default function ExchangeRateWidget() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [rates, setRates] = useState<ExchangeRate[]>([
    { currency: 'USD', rate: 4.1234, change: 0.15, color: '#0088FE' },
    { currency: 'EUR', rate: 4.9731, change: -0.05, color: '#00C49F' },
    { currency: 'TRY', rate: 0.1324, change: 0.02, color: '#FFBB28' }
  ]);
  const [historicalData, setHistoricalData] = useState<HistoricalRate[]>([]);

  // Fetch exchange rates from the local database
  const fetchRatesFromDatabase = async () => {
    setIsLoading(true);
    try {
      // Get the latest BNR rates from the database
      const response = await axios.get('/api/integrations/exchange-rates/bnr/all');
      
      if (response.data && response.data.rates) {
        // Get yesterday's rates for comparison
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Get historical rates to calculate change
        const historicalResponse = await axios.get(
          `/api/integrations/exchange-rates/historical?currencies=USD,EUR,TRY&days=2`
        );
        
        const historicalData = historicalResponse.data?.data || [];
        const yesterdayRates = historicalData.length > 1 ? historicalData[0] : null;
        
        // Format the rates with change percentage
        const formattedRates = [
          {
            currency: 'USD',
            rate: response.data.rates.USD || 0,
            change: calculateChange(response.data.rates.USD, yesterdayRates?.USD),
            color: '#0088FE'
          },
          {
            currency: 'EUR',
            rate: response.data.rates.EUR || 0,
            change: calculateChange(response.data.rates.EUR, yesterdayRates?.EUR),
            color: '#00C49F'
          },
          {
            currency: 'TRY',
            rate: response.data.rates.TRY || 0,
            change: calculateChange(response.data.rates.TRY, yesterdayRates?.TRY),
            color: '#FFBB28'
          }
        ];
        
        setRates(formattedRates);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching exchange rates from database:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manually refresh from online source to database
  const refreshRatesFromOnlineSource = async () => {
    setRefreshing(true);
    try {
      // Call the manual update endpoint
      const response = await axios.post('/api/integrations/exchange-rates/bnr/update');
      
      if (response.data && response.data.success) {
        // After updating the database, fetch the rates again
        await fetchRatesFromDatabase();
        await fetchHistoricalRates();
        console.log('Successfully refreshed exchange rates from online source');
      }
    } catch (error) {
      console.error('Error refreshing exchange rates from online source:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Helper function to calculate percent change
  const calculateChange = (currentRate: number, previousRate: number | null | undefined): number => {
    if (!previousRate || !currentRate) return 0;
    return ((currentRate - previousRate) / previousRate) * 100;
  };

  // Fetch historical exchange rates from the database
  const fetchHistoricalRates = async () => {
    try {
      // Call the historical rates API that gets data from the database
      const response = await axios.get(
        '/api/integrations/exchange-rates/historical?currencies=USD,EUR,TRY&days=10'
      );
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // API returns data in the correct format already
        setHistoricalData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching historical rates:', error);
    }
  };

  // Fetch data on initial render
  useEffect(() => {
    fetchRatesFromDatabase();
    fetchHistoricalRates();
  }, []);

  // Handle refresh button click - trigger manual update from online source
  const handleRefresh = () => {
    refreshRatesFromOnlineSource();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Curs BNR</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing}
        >
          <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Se actualizează...' : 'Actualizează'}
        </Button>
      </div>
      
      {/* Exchange rates cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {rates.map((rate) => (
          <div key={rate.currency} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">{rate.currency}</span>
              <span 
                className={`text-xs font-medium ${
                  rate.change > 0 ? 'text-green-600' : rate.change < 0 ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {rate.change > 0 ? '+' : ''}{rate.change.toFixed(2)}%
              </span>
            </div>
            <div className="text-xl font-bold mt-1">
              {isLoading ? '...' : rate.rate.toFixed(4)} RON
            </div>
          </div>
        ))}
      </div>
      
      {/* Historical chart */}
      <div className="w-full h-60 rounded-md mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={historicalData}
            margin={{
              top: 5,
              right: 5,
              left: 5,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(4)} RON`}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="USD" 
              stroke="#0088FE" 
              activeDot={{ r: 8 }} 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="EUR" 
              stroke="#00C49F" 
              activeDot={{ r: 8 }} 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="TRY" 
              stroke="#FFBB28" 
              activeDot={{ r: 8 }} 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Last updated timestamp */}
      <div className="text-xs text-gray-500 text-right">
        Ultima actualizare: {lastUpdated.toLocaleString('ro-RO')}
      </div>
    </div>
  );
}