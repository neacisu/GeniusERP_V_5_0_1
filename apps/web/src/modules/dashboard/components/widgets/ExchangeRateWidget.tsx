/**
 * Exchange Rate Widget
 * 
 * Dashboard widget that displays current exchange rates from Romanian National Bank (BNR).
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';
import { 
  DollarSign,
  Euro,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExchangeRate {
  currency: string;
  rate: number;
  change: number;
  symbol: string;
  name: string;
  lastUpdated: string;
}

export default function ExchangeRateWidget() {
  // Fetch exchange rates
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      // This would normally fetch from a real API endpoint
      // For now, return mock data that would match the real data structure
      return [
        { currency: 'EUR', rate: 4.9728, change: 0.0015, symbol: '€', name: 'Euro', lastUpdated: '2025-04-13' },
        { currency: 'USD', rate: 4.5921, change: -0.0023, symbol: '$', name: 'Dolar SUA', lastUpdated: '2025-04-13' },
        { currency: 'GBP', rate: 5.8764, change: 0.0034, symbol: '£', name: 'Liră sterlină', lastUpdated: '2025-04-13' },
        { currency: 'CHF', rate: 5.1283, change: 0.0006, symbol: 'Fr', name: 'Franc elvețian', lastUpdated: '2025-04-13' },
        { currency: 'HUF', rate: 0.0127, change: -0.0001, symbol: 'Ft', name: 'Forint', lastUpdated: '2025-04-13' },
        { currency: 'BGN', rate: 2.5427, change: 0.0008, symbol: 'лв', name: 'Leva bulgărească', lastUpdated: '2025-04-13' }
      ] as ExchangeRate[];
    },
    staleTime: 3600000 // 1 hour
  });
  
  const rates = data || [];
  
  // Get currency icon
  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'EUR':
        return <Euro className="h-5 w-5 text-blue-600" />;
      case 'USD':
      case 'GBP':
      case 'CHF':
      case 'CAD':
      case 'AUD':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };
  
  // Get change icon
  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <ArrowUp className="h-3 w-3 text-green-500" />;
    } else if (change < 0) {
      return <ArrowDown className="h-3 w-3 text-red-500" />;
    } else {
      return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };
  
  // Format change value
  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(4)}`;
  };
  
  // Get change color class
  const getChangeColorClass = (change: number) => {
    if (change > 0) {
      return 'text-green-600';
    } else if (change < 0) {
      return 'text-red-600';
    } else {
      return 'text-gray-600';
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">Cursuri Valutare BNR</CardTitle>
            <CardDescription>
              {rates.length > 0 && `Actualizat la ${rates[0].lastUpdated}`}
            </CardDescription>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                <span>Se încarcă...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                <span>Actualizează</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Nu s-au putut încărca cursurile valutare.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Încearcă din nou
            </Button>
          </div>
        ) : rates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nu sunt disponibile cursuri valutare.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {rates.map((rate) => (
              <div 
                key={rate.currency} 
                className="flex flex-col p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  {getCurrencyIcon(rate.currency)}
                  <span className="font-medium">{rate.currency}</span>
                </div>
                
                <div className="text-lg font-semibold mt-1">
                  {rate.rate.toFixed(4)} RON
                </div>
                
                <div className={cn("text-xs flex items-center gap-1 mt-1", getChangeColorClass(rate.change))}>
                  {getChangeIcon(rate.change)}
                  <span>{formatChange(rate.change)}</span>
                </div>
                
                <div className="text-xs text-gray-500 mt-2 line-clamp-1">
                  {rate.symbol} - {rate.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500 pt-0">
        <p>Sursa: Banca Națională a României (BNR)</p>
      </CardFooter>
    </Card>
  );
}