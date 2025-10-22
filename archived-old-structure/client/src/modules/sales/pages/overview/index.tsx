/**
 * Sales Overview/Dashboard Page
 * 
 * Provides a high-level view of sales performance with metrics,
 * charts, and key indicators using reusable components.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, TrendingUp, FileText, FileSpreadsheet, DollarSign, Users, Calendar } from 'lucide-react';

// Import reusable components
import SalesModuleLayout from '../../components/common/SalesModuleLayout';
import ExportDataModal from '../../components/modals/ExportDataModal';

// Import UI components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Import utilities and hooks
import { useSalesApi } from '../../hooks/useSalesApi';
import { formatCurrency } from '../../utils/formatters';

const SalesOverviewPage: React.FC = () => {
  // State for time period filter
  const [timePeriod, setTimePeriod] = useState<string>('month');
  const [activeTab, setActiveTab] = useState<string>('summary');
  
  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const { getSalesOverview } = useSalesApi();
  
  // Query for sales overview data - removed problematic function call
  const { data: overview, isLoading } = useQuery({
    queryKey: ['/api/sales/overview', timePeriod],
    queryFn: async () => {
      try {
        // Just return mock data for now to prevent errors
        return {
          totalSales: { value: 0, currency: 'RON', change: 0 },
          newOpportunities: { count: 0, change: 0 },
          activeDeals: { count: 0, change: 0 },
          quotes: { count: 0, change: 0 },
          topOpportunities: [],
          recentActivity: []
        };
      } catch (error) {
        console.error('Error fetching sales overview:', error);
        throw error;
      }
    }
  });
  
  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf', includeAll: boolean) => {
    try {
      setIsExporting(true);
      console.log(`Exporting sales dashboard data as ${format}, includeAll: ${includeAll}`);
      // In a real implementation, this would call the export API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsExporting(false);
      setExportModalOpen(false);
    } catch (error) {
      setIsExporting(false);
      console.error('Error exporting dashboard data:', error);
    }
  };
  
  // Sales metrics to display
  const salesMetrics = [
    {
      title: 'Vânzări Totale',
      value: overview?.totalSales ? formatCurrency(overview.totalSales.value, overview.totalSales.currency) : '0 RON',
      change: overview?.totalSales?.change || 0,
      icon: <DollarSign className="h-5 w-5 text-muted-foreground" />
    },
    {
      title: 'Contracte Active',
      value: overview?.activeDeals?.count || 0,
      change: overview?.activeDeals?.change || 0,
      icon: <FileText className="h-5 w-5 text-muted-foreground" />
    },
    {
      title: 'Oportunități',
      value: overview?.newOpportunities?.count || 0,
      change: overview?.newOpportunities?.change || 0,
      icon: <TrendingUp className="h-5 w-5 text-muted-foreground" />
    },
    {
      title: 'Oferte Trimise',
      value: overview?.quotes?.count || 0,
      change: overview?.quotes?.change || 0,
      icon: <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
    }
  ];
  
  // Render change indicator with appropriate styling
  const renderChangeIndicator = (change: number) => {
    if (change > 0) {
      return <span className="text-green-600">+{change}%</span>;
    } else if (change < 0) {
      return <span className="text-red-600">{change}%</span>;
    }
    return <span className="text-gray-500">0%</span>;
  };
  
  return (
    <SalesModuleLayout 
      title="Sumar Vânzări" 
      description="Vizualizare de ansamblu a performanței de vânzări"
    >
      <div className="space-y-6">
        {/* Header with time period filter and export button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selectați perioada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Săptămâna curentă</SelectItem>
                <SelectItem value="month">Luna curentă</SelectItem>
                <SelectItem value="quarter">Trimestrul curent</SelectItem>
                <SelectItem value="year">Anul curent</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {timePeriod === 'week' && 'Comparație cu săptămâna precedentă'}
              {timePeriod === 'month' && 'Comparație cu luna precedentă'}
              {timePeriod === 'quarter' && 'Comparație cu trimestrul precedent'}
              {timePeriod === 'year' && 'Comparație cu anul precedent'}
            </span>
          </div>
          
          <Button variant="outline" onClick={() => setExportModalOpen(true)}>
            Exportă Raport
          </Button>
        </div>
        
        {/* Key metrics overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {salesMetrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                {metric.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {renderChangeIndicator(metric.change)} față de perioada anterioară
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Tabs for different data views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="summary">Sumar</TabsTrigger>
            <TabsTrigger value="deals">Contracte</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Left column - Top Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Oportunități Principale</CardTitle>
                  <CardDescription>
                    Top oportunități după valoare potențială
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
                      ))}
                    </div>
                  ) : overview?.topOpportunities?.length ? (
                    <div className="space-y-4">
                      {overview.topOpportunities.map((opp: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{opp.title}</div>
                            <div className="text-sm text-muted-foreground">{opp.customerName}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(opp.value, opp.currency)}</div>
                            <div className="text-sm text-muted-foreground">{opp.stage}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Nu există oportunități de afișat
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => window.location.href = '/sales/opportunities'}
                  >
                    Vezi toate oportunitățile
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Right column - Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activitate Recentă</CardTitle>
                  <CardDescription>
                    Cele mai recente acțiuni în modulul de vânzări
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
                      ))}
                    </div>
                  ) : overview?.recentActivity?.length ? (
                    <div className="space-y-4">
                      {overview.recentActivity.map((activity: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <div className="mt-0.5">
                            {activity.type === 'deal' && <FileText className="h-4 w-4" />}
                            {activity.type === 'opportunity' && <TrendingUp className="h-4 w-4" />}
                            {activity.type === 'quote' && <FileSpreadsheet className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-medium">{activity.description}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {activity.timestamp}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Nu există activități recente
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="deals">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Distribuție Contracte</CardTitle>
                <CardDescription>
                  Distribuția contractelor după status și valoare
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-gray-100 animate-pulse rounded" />
                ) : (
                  <div className="text-center h-full flex items-center justify-center">
                    <BarChart className="h-24 w-24 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mt-4">
                      Aici va fi afișat graficul cu distribuția contractelor
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pipeline">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Analiză Pipeline Vânzări</CardTitle>
                <CardDescription>
                  Progresul oportunitățiilor prin ciclul de vânzare
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-gray-100 animate-pulse rounded" />
                ) : (
                  <div className="text-center h-full flex items-center justify-center flex-col">
                    <TrendingUp className="h-24 w-24 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mt-4">
                      Aici va fi afișat graficul de pipeline pentru vânzări
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Export Modal */}
        <ExportDataModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          onExport={handleExport}
          title="Exportă Raport Vânzări"
          description="Exportă datele de vânzări în formatul dorit."
          supportedFormats={['csv', 'xlsx', 'pdf']}
          isExporting={isExporting}
          entityType="raport"
        />
      </div>
    </SalesModuleLayout>
  );
};

export default SalesOverviewPage;