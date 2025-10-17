/**
 * Marketing Analytics Page
 * 
 * Provides detailed analytics for marketing campaigns.
 */

import React, { useState } from "react";
import { Link } from "wouter";
import {
  BarChart,
  PieChart,
  LineChart,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Users,
  Layers,
  Target,
  Map
} from "lucide-react";
import { useMarketingStatistics } from "../../hooks/useMarketingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart as ReChartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart as ReChartsLineChart,
  Line,
  Legend,
  PieChart as ReChartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("performance");
  const { stats, isLoading } = useMarketingStatistics();
  
  // Dummy data for analytics charts - should be replaced with real data when available
  const performanceByChannelData = [
    { name: 'Email', value: 68, color: '#3b82f6' },
    { name: 'SMS', value: 45, color: '#10b981' },
    { name: 'Social', value: 72, color: '#6366f1' },
    { name: 'Push', value: 53, color: '#f59e0b' },
    { name: 'WhatsApp', value: 77, color: '#22c55e' },
  ];
  
  const engagementByTimeData = [
    { hour: '00:00', rate: 12 },
    { hour: '03:00', rate: 8 },
    { hour: '06:00', rate: 15 },
    { hour: '09:00', rate: 42 },
    { hour: '12:00', rate: 57 },
    { hour: '15:00', rate: 63 },
    { hour: '18:00', rate: 78 },
    { hour: '21:00', rate: 35 },
  ];
  
  const deviceBreakdownData = [
    { name: 'Desktop', value: 45, color: '#3b82f6' },
    { name: 'Mobile', value: 42, color: '#10b981' },
    { name: 'Tablet', value: 13, color: '#f59e0b' },
  ];
  
  const campaignPerformanceData = [
    { name: 'Newsletter Iunie', openRate: 35, clickRate: 22, conversionRate: 5 },
    { name: 'Promo Reduceri', openRate: 42, clickRate: 28, conversionRate: 8 },
    { name: 'Anunț Webinar', openRate: 52, clickRate: 32, conversionRate: 12 },
    { name: 'Lansare Produs', openRate: 68, clickRate: 45, conversionRate: 18 },
    { name: 'Oferta Flash', openRate: 48, clickRate: 30, conversionRate: 7 },
  ];
  
  const channelEffectivenessData = [
    {
      channel: 'Email',
      delivery: 95,
      engagement: 65,
      conversion: 25,
      retention: 70,
    },
    {
      channel: 'SMS',
      delivery: 98,
      engagement: 40,
      conversion: 15,
      retention: 55,
    },
    {
      channel: 'Social',
      delivery: 100,
      engagement: 80,
      conversion: 20,
      retention: 45,
    },
    {
      channel: 'Push',
      delivery: 95,
      engagement: 55,
      conversion: 12,
      retention: 40,
    },
    {
      channel: 'WhatsApp',
      delivery: 97,
      engagement: 75,
      conversion: 22,
      retention: 65,
    },
  ];
  
  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analiză Marketing</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Interval</span>
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Export</span>
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>
      
      {/* Analytics Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rată Deschidere
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${Math.round(stats.openRate * 100)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? <Skeleton className="h-4 w-28 mt-1" /> : "+15% față de luna trecută"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rată Click
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${Math.round(stats.clickRate * 100)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? <Skeleton className="h-4 w-28 mt-1" /> : "+8% față de luna trecută"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversie
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : "3.5%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? <Skeleton className="h-4 w-28 mt-1" /> : "+2% față de luna trecută"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ROI Marketing
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : "412%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? <Skeleton className="h-4 w-28 mt-1" /> : "+58% față de luna trecută"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="performance" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="performance">
            <BarChart className="h-4 w-4 mr-2" />
            Performanță
          </TabsTrigger>
          <TabsTrigger value="audience">
            <Users className="h-4 w-4 mr-2" />
            Audiență
          </TabsTrigger>
          <TabsTrigger value="channels">
            <Layers className="h-4 w-4 mr-2" />
            Canale
          </TabsTrigger>
          <TabsTrigger value="attribution">
            <Target className="h-4 w-4 mr-2" />
            Atribuire
          </TabsTrigger>
        </TabsList>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {/* Campaign Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performanța Campaniilor</CardTitle>
              <CardDescription>
                Compararea ratelor de deschidere, click și conversie pentru campaniile recente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsBarChart
                      data={campaignPerformanceData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 70,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                      <Bar dataKey="openRate" name="Rată Deschidere" fill="#3b82f6" />
                      <Bar dataKey="clickRate" name="Rată Click" fill="#10b981" />
                      <Bar dataKey="conversionRate" name="Rată Conversie" fill="#f59e0b" />
                    </ReChartsBarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Time-based Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Analiza Temporală a Angajamentului</CardTitle>
              <CardDescription>
                Rată de angajament în funcție de ora zilei
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsLineChart
                      data={engagementByTimeData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, 'Rată Angajament']} />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </ReChartsLineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Cel mai bun moment pentru trimiterea campaniilor: <strong>18:00</strong>
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          {/* Device Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuție Device-uri</CardTitle>
                <CardDescription>
                  Utilizare device-uri pentru accesarea campaniilor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-[300px] w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReChartsPieChart>
                        <Pie
                          data={deviceBreakdownData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {deviceBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </ReChartsPieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Demographic breakdown placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Demografice Audiență</CardTitle>
                <CardDescription>
                  Distribuția demografică a audienței
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Datele demografice vor fi disponibile curând</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Geographic distribution placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuție Geografică</CardTitle>
              <CardDescription>
                Performanța campaniilor pe regiuni geografice
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <Map className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Distribuția geografică va fi disponibilă curând</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          {/* Channel Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Eficacitatea Canalelor</CardTitle>
              <CardDescription>
                Analiza performanței pe canale de comunicare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={channelEffectivenessData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="channel" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Livrare"
                        dataKey="delivery"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Angajament"
                        dataKey="engagement"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Conversie"
                        dataKey="conversion"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Retenție"
                        dataKey="retention"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                      />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Channel ROI Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performanță pe Canale</CardTitle>
              <CardDescription>
                Scor general de performanță pentru fiecare canal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsBarChart
                      data={performanceByChannelData}
                      layout="vertical"
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip formatter={(value) => [`${value}%`, 'Scor performanță']} />
                      <Bar dataKey="value" fill="#3b82f6" label={{ position: 'right', fill: '#666' }} />
                    </ReChartsBarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Canal recomandat pentru următoarea campanie: <strong>WhatsApp</strong>
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Attribution Tab - placeholder */}
        <TabsContent value="attribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model de Atribuire</CardTitle>
              <CardDescription>
                Atribuirea conversiilor pe diferite canale și puncte de contact
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <Target className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Modelul de atribuire va fi disponibil curând</p>
                <Button variant="outline" asChild>
                  <Link href="/marketing/reports">
                    Vezi rapoarte disponibile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;