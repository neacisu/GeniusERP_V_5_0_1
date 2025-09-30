/**
 * Marketing Reports Page
 * 
 * Displays marketing campaign reports and analytics.
 */

import React, { useState } from "react";
import { Link } from "wouter";
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  RefreshCw,
  BarChart2,
  PieChart,
  TrendingUp,
  Mail,
  Share2,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignType } from "../../types";
import { useMarketingStatistics } from "../../hooks/useMarketingApi";
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  PieChart as ReChartsPieChart,
  Pie,
  Cell
} from "recharts";

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, isLoading } = useMarketingStatistics();
  
  // Pie chart data for campaign types
  const campaignTypeData = [
    { name: 'Email', value: 42, color: '#3b82f6' },
    { name: 'SMS', value: 18, color: '#10b981' },
    { name: 'Social Media', value: 22, color: '#6366f1' },
    { name: 'Push', value: 8, color: '#f59e0b' },
    { name: 'WhatsApp', value: 10, color: '#22c55e' }
  ];
  
  // Performance over time data
  const performanceData = [
    { month: 'Ian', openRate: 28, clickRate: 15, responseRate: 5 },
    { month: 'Feb', openRate: 31, clickRate: 17, responseRate: 7 },
    { month: 'Mar', openRate: 36, clickRate: 20, responseRate: 9 },
    { month: 'Apr', openRate: 39, clickRate: 22, responseRate: 10 },
    { month: 'Mai', openRate: 37, clickRate: 21, responseRate: 8 },
    { month: 'Iun', openRate: 35, clickRate: 19, responseRate: 7 },
  ];
  
  // Channel effectiveness data
  const channelData = [
    {
      name: 'Email',
      deliveryRate: 96,
      openRate: 32,
      clickRate: 12,
    },
    {
      name: 'SMS',
      deliveryRate: 98,
      openRate: 0,
      clickRate: 8,
    },
    {
      name: 'Social',
      deliveryRate: 100,
      openRate: 0,
      clickRate: 15,
    },
    {
      name: 'Push',
      deliveryRate: 95,
      openRate: 28,
      clickRate: 7,
    },
    {
      name: 'WhatsApp',
      deliveryRate: 97,
      openRate: 75,
      clickRate: 18,
    },
  ];
  
  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rapoarte Marketing</h1>
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
      
      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart2 className="h-4 w-4 mr-2" />
            Prezentare generală
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Mail className="h-4 w-4 mr-2" />
            Campanii
          </TabsTrigger>
          <TabsTrigger value="channels">
            <Share2 className="h-4 w-4 mr-2" />
            Canale
          </TabsTrigger>
          <TabsTrigger value="audience">
            <MessageSquare className="h-4 w-4 mr-2" />
            Audiență
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Performance Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Campanii
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalCampaigns}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? <Skeleton className="h-4 w-28 mt-1" /> : `${stats.activeCampaigns} active`}
                </p>
              </CardContent>
            </Card>
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
                  {isLoading ? <Skeleton className="h-4 w-28 mt-1" /> : "Media tuturor campaniilor"}
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
                  {isLoading ? <Skeleton className="h-4 w-28 mt-1" /> : "Media tuturor campaniilor"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Audiență Totală
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalAudience.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? <Skeleton className="h-4 w-28 mt-1" /> : `${stats.totalSegments} segmente`}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Chart Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Campaign Types Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribuția Campaniilor</CardTitle>
                <CardDescription>
                  Campanii după tip
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-[300px] w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReChartsPieChart>
                        <Pie
                          data={campaignTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {campaignTypeData.map((entry, index) => (
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
            
            {/* Performance Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Performanță în Timp</CardTitle>
                <CardDescription>
                  Evoluția ratelor de deschidere, click și răspuns
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-[300px] w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={performanceData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis unit="%" />
                        <Tooltip formatter={(value) => [`${value}%`, '']} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="openRate"
                          stroke="#3b82f6"
                          name="Rată Deschidere"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="clickRate"
                          stroke="#10b981"
                          name="Rată Click"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="responseRate"
                          stroke="#f59e0b"
                          name="Rată Răspuns"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Channel Effectiveness */}
          <Card>
            <CardHeader>
              <CardTitle>Eficacitatea Canalelor</CardTitle>
              <CardDescription>
                Comparația performanței între diferitele canale de comunicare
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
                    <BarChart
                      data={channelData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                      <Bar dataKey="deliveryRate" name="Rată Livrare" fill="#3b82f6" />
                      <Bar dataKey="openRate" name="Rată Deschidere" fill="#10b981" />
                      <Bar dataKey="clickRate" name="Rată Click" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/marketing/analytics">
                  Vezi analiză detaliată
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Other tabs would have their content here */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performanța Campaniilor</CardTitle>
              <CardDescription>
                Comparația între campanii după rate de deschidere și click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-8 text-center">
                Detalii despre performanța campaniilor vor fi disponibile curând.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analiza Canalelor</CardTitle>
              <CardDescription>
                Eficacitatea diferitelor canale de comunicare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-8 text-center">
                Analiza canalelor de comunicare va fi disponibilă curând.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segmente de Audiență</CardTitle>
              <CardDescription>
                Performanța campaniilor pe diferite segmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-8 text-center">
                Analiza segmentelor de audiență va fi disponibilă curând.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;