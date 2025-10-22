/**
 * CRM Forecasting Page
 * 
 * Provides sales forecasting and revenue prediction tools
 * with various visualization options and configurable parameters.
 */

import React, { useState } from 'react';
import { CRMModuleLayout } from '../../components/common/CRMModuleLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Download, 
  LineChart, 
  Minus, 
  Plus, 
  RefreshCw, 
  Settings,
  TrendingUp,
  BarChart2,
  User,
  CalendarRange
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Sample revenue forecasts data (quarterly)
const revenueForecasts = [
  { 
    quarter: 'Q1 2025', 
    pipeline: 3500000, 
    weighted: 1750000, 
    bestCase: 2100000, 
    commit: 1400000, 
    closed: 1200000,
    accuracy: 92
  },
  { 
    quarter: 'Q2 2025', 
    pipeline: 4200000, 
    weighted: 2100000, 
    bestCase: 2520000, 
    commit: 1680000, 
    closed: 950000,
    accuracy: 0 // In progress, no accuracy yet
  },
  { 
    quarter: 'Q3 2025', 
    pipeline: 3800000, 
    weighted: 1900000, 
    bestCase: 2280000, 
    commit: 1520000, 
    closed: 0,
    accuracy: 0 // Future, no accuracy yet
  },
  { 
    quarter: 'Q4 2025', 
    pipeline: 4500000, 
    weighted: 2250000, 
    bestCase: 2700000, 
    commit: 1800000, 
    closed: 0,
    accuracy: 0 // Future, no accuracy yet
  }
];

// Sample monthly data for current quarter (Q2)
const monthlyData = [
  {
    month: 'Apr 2025',
    pipeline: 1400000,
    weighted: 700000,
    bestCase: 840000,
    commit: 560000,
    closed: 530000,
    accuracy: 95
  },
  {
    month: 'May 2025',
    pipeline: 1400000,
    weighted: 700000,
    bestCase: 840000,
    commit: 560000,
    closed: 420000,
    accuracy: 0 // In progress
  },
  {
    month: 'Jun 2025',
    pipeline: 1400000,
    weighted: 700000,
    bestCase: 840000,
    commit: 560000,
    closed: 0,
    accuracy: 0 // Future
  }
];

// Sample quota attainment by salesperson
const salesQuotas = [
  {
    id: 'u1',
    name: 'Alexandru Popa',
    targetQ2: 600000,
    actualQ2: 420000,
    progressPercent: 70,
    deals: 8,
    avgDealSize: 52500
  },
  {
    id: 'u2',
    name: 'Maria Dinu',
    targetQ2: 500000,
    actualQ2: 380000,
    progressPercent: 76,
    deals: 6,
    avgDealSize: 63333
  },
  {
    id: 'u3',
    name: 'Andrei Vasilescu',
    targetQ2: 450000,
    actualQ2: 290000,
    progressPercent: 64,
    deals: 5,
    avgDealSize: 58000
  },
  {
    id: 'u4',
    name: 'Elena Popescu',
    targetQ2: 400000,
    actualQ2: 310000,
    progressPercent: 78,
    deals: 7,
    avgDealSize: 44286
  }
];

const ForecastingPage: React.FC = () => {
  const { toast } = useToast();
  const [periodFilter, setPeriodFilter] = useState('quarter');
  const [yearFilter, setYearFilter] = useState('2025');
  const [viewMode, setViewMode] = useState('revenue');
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value}%`;
  };
  
  // Handle refresh forecasts action
  const handleRefreshForecasts = () => {
    toast({
      title: "Prognoze actualizate",
      description: "Prognozele au fost recalculate cu datele cele mai recente.",
    });
  };
  
  // Handle export action
  const handleExport = () => {
    toast({
      title: "Export prognoze",
      description: "Funcționalitate în curând disponibilă.",
    });
  };
  
  // Handle settings action
  const handleSettings = () => {
    toast({
      title: "Setări prognoze",
      description: "Funcționalitate în curând disponibilă.",
    });
  };
  
  // Get total for current quarter
  const currentQuarter = revenueForecasts[1]; // Q2 2025
  
  // Calculate team quota attainment
  const totalQuota = salesQuotas.reduce((sum, person) => sum + person.targetQ2, 0);
  const totalActual = salesQuotas.reduce((sum, person) => sum + person.actualQ2, 0);
  const teamAttainmentPercent = Math.round((totalActual / totalQuota) * 100);
  
  return (
    <CRMModuleLayout activeTab="forecasting">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Prognoze</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshForecasts}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizează
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSettings}
            >
              <Settings className="h-4 w-4 mr-2" />
              Setări
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Tabs 
            value={viewMode} 
            onValueChange={setViewMode}
            className="w-auto"
          >
            <TabsList className="grid w-[360px] grid-cols-3">
              <TabsTrigger value="revenue" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4 mr-1" />
                <span>Prognoză Venituri</span>
              </TabsTrigger>
              <TabsTrigger value="quota" className="flex items-center gap-1">
                <User className="h-4 w-4 mr-1" />
                <span>Cote Vânzări</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-1">
                <LineChart className="h-4 w-4 mr-1" />
                <span>Tendințe</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Periodicitate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Lunar</SelectItem>
                <SelectItem value="quarter">Trimestrial</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="An" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Main Content - Tabs container */}
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsContent value="revenue" className="mt-0 space-y-6">
            {/* Current Quarter Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pipeline Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="text-2xl font-bold">{formatCurrency(currentQuarter.pipeline)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valoarea totală a tuturor oportunităților
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Prognoză Ajustată
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="text-2xl font-bold">{formatCurrency(currentQuarter.weighted)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valoare ponderată cu probabilități
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Scenariu Optimist
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="text-2xl font-bold">{formatCurrency(currentQuarter.bestCase)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valoare maximă potențială
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Prognoză Finală
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="text-2xl font-bold">{formatCurrency(currentQuarter.commit)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valoare confirmată pentru trimestru
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Închis Până Acum
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="text-2xl font-bold">{formatCurrency(currentQuarter.closed)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPercentage(Math.round((currentQuarter.closed / currentQuarter.commit) * 100))} din prognoză
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Detailed Forecast Table */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Prognoză Detaliată {periodFilter === 'quarter' ? 'Trimestrială' : periodFilter === 'month' ? 'Lunară' : 'Anuală'}</CardTitle>
                <CardDescription>
                  Vizualizare detaliată a prognozelor financiare pentru {yearFilter}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
                    <div>Perioadă</div>
                    <div className="text-right">Pipeline</div>
                    <div className="text-right">Ajustat</div>
                    <div className="text-right">Optimist</div>
                    <div className="text-right">Final</div>
                    <div className="text-right">Închis</div>
                    <div className="text-right">Acuratețe</div>
                  </div>
                  
                  <div className="divide-y">
                    {(periodFilter === 'quarter' ? revenueForecasts : monthlyData).map((forecast, index) => (
                      <div 
                        key={index} 
                        className={`grid grid-cols-7 p-3 text-sm ${index === 1 ? 'bg-primary/5' : ''}`}
                      >
                        <div className="font-medium flex items-center">
                          {index === 1 && (
                            <Badge className="mr-2 bg-primary text-primary-foreground">Curent</Badge>
                          )}
                          {'quarter' in forecast ? forecast.quarter : forecast.month}
                        </div>
                        <div className="text-right">{formatCurrency(forecast.pipeline)}</div>
                        <div className="text-right">{formatCurrency(forecast.weighted)}</div>
                        <div className="text-right">{formatCurrency(forecast.bestCase)}</div>
                        <div className="text-right">{formatCurrency(forecast.commit)}</div>
                        <div className="text-right">
                          {forecast.closed > 0 ? formatCurrency(forecast.closed) : '-'}
                        </div>
                        <div className="text-right">
                          {forecast.accuracy > 0 ? `${forecast.accuracy}%` : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium">Pipeline:</span> Suma tuturor oportunităților • 
                    <span className="font-medium ml-2">Ajustat:</span> Valoare ponderată cu probabilitățile de închidere • 
                    <span className="font-medium ml-2">Optimist:</span> Cel mai bun scenariu posibil • 
                    <span className="font-medium ml-2">Final:</span> Prognoză confirmată
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Forecast Visualization */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Vizualizare Grafică</CardTitle>
                <CardDescription>
                  Comparație vizuală între diferitele tipuri de prognoze
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center border rounded-md">
                  <div className="text-center">
                    <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Vizualizare grafică în curând disponibilă</p>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                      Lucrăm la implementarea vizualizărilor grafice interactive pentru prognozele de vânzări.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="quota" className="mt-0 space-y-6">
            {/* Team Quota Summary */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Progres Cote de Vânzări - Q2 2025</CardTitle>
                <CardDescription>
                  Progresul echipei și individual față de cotele stabilite
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Team Summary */}
                <div className="mb-8 border rounded-md p-4">
                  <div className="flex flex-col sm:flex-row justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium flex items-center">
                        <User className="h-5 w-5 mr-2 text-primary" />
                        Progres Echipă
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Progresul total al echipei față de cota trimestrială
                      </p>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <div className="text-2xl font-bold">
                        {formatCurrency(totalActual)} <span className="text-base font-normal text-muted-foreground">/ {formatCurrency(totalQuota)}</span>
                      </div>
                      <div className="text-sm">
                        <span className={`font-medium ${teamAttainmentPercent >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                          {teamAttainmentPercent}% atins
                        </span> - {salesQuotas.length} persoane
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-primary rounded-full h-4" 
                      style={{ width: `${teamAttainmentPercent}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Individual Quota Progress */}
                <div className="space-y-6">
                  {salesQuotas.map(person => (
                    <div key={person.id} className="border rounded-md p-4">
                      <div className="flex flex-col sm:flex-row justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{person.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {person.deals} oportunități • Medie: {formatCurrency(person.avgDealSize)}
                          </p>
                        </div>
                        <div className="text-right mt-2 sm:mt-0">
                          <div className="font-medium">
                            {formatCurrency(person.actualQ2)} <span className="text-sm font-normal text-muted-foreground">/ {formatCurrency(person.targetQ2)}</span>
                          </div>
                          <div className="text-sm">
                            <span className={`font-medium ${person.progressPercent >= 70 ? 'text-green-600' : person.progressPercent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                              {person.progressPercent}% atins
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`rounded-full h-2.5 ${
                            person.progressPercent >= 70 ? 'bg-green-600' : 
                            person.progressPercent >= 50 ? 'bg-amber-600' : 
                            'bg-red-600'
                          }`}
                          style={{ width: `${person.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends" className="mt-0 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Analiză Tendințe</CardTitle>
                <CardDescription>
                  Tendințe istorice și previziuni pentru vânzări
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center border rounded-md h-[500px]">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Analiză tendințe în curând disponibilă</p>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                      Implementăm algoritmi avansați de analiză pentru a oferi previziuni bazate pe tendințele istorice.
                    </p>
                    <CalendarRange className="h-8 w-8 text-gray-300 mx-auto mt-8" />
                    <p className="text-sm text-gray-500 mt-2">Istoric disponibil din {yearFilter}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CRMModuleLayout>
  );
};

export default ForecastingPage;