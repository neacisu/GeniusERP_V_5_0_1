/**
 * Analytics Metrics Page
 * 
 * Pagină pentru vizualizarea și monitorizarea indicatorilor de performanță
 * din diverse departamente și domenii ale afacerii.
 */

import React, { useState } from 'react';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  BarChart4, 
  Clock, 
  DollarSign, 
  Download, 
  FilePlus2, 
  Filter, 
  LineChart as LineChartIcon, 
  Package, 
  Search, 
  ShoppingCart, 
  TrendingDown, 
  TrendingUp, 
  UserPlus,
  Wallet,
  BarChartHorizontal,
  Building2,
  MessageCircle,
  ClipboardCheck,
  ArrowRight,
  RefreshCw,
  FileText,
  Eye,
  Target,
  LayoutGrid,
  List,
  CalendarClock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsEmptyState } from '../../components/common/AnalyticsEmptyState';
import { AnalyticsOverviewCard } from '../../components/common/AnalyticsOverviewCard';
import { AnalyticsLayout } from '../../components/common/AnalyticsLayout';

// Tipuri pentru pagina de metrici
interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  targetValue?: number;
  targetPercent?: number;
  sparklineData?: Array<{ value: number }>;
  timeframe?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState<string>('month');
  const [category, setCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { metrics, summary, isLoading } = useAnalyticsMetrics({
    timeRange,
    category: category !== 'all' ? category : undefined
  });
  
  // Date pentru mini-grafice
  const miniChartData = Array(10).fill(0).map((_, i) => ({ value: Math.floor(Math.random() * 100) + 50 }));
  
  // Funcție pentru formatarea valorilor monetare
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Categorii de metrici
  const metricCategories = [
    { id: 'all', name: 'Toate categoriile', icon: <BarChart4 className="h-4 w-4" /> },
    { id: 'financial', name: 'Financiar', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'sales', name: 'Vânzări', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'inventory', name: 'Inventar', icon: <Package className="h-4 w-4" /> },
    { id: 'marketing', name: 'Marketing', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'operations', name: 'Operațional', icon: <Building2 className="h-4 w-4" /> },
    { id: 'customer', name: 'Clienți', icon: <UserPlus className="h-4 w-4" /> },
  ];
  
  const renderMetricValue = (metric: any) => {
    if (metric.unit === 'currency') {
      return formatCurrency(metric.value);
    } else if (metric.unit === 'percent') {
      return `${metric.value}%`;
    } else if (metric.unit === 'count') {
      return metric.value.toLocaleString();
    } else {
      return metric.value.toString();
    }
  };
  
  // Funcție pentru generarea iconului corect în funcție de trend
  const renderTrendIcon = (trend: 'up' | 'down' | 'neutral', change: number) => {
    if (trend === 'up') {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUpIcon className="h-4 w-4 mr-1" />
          <span>+{change}%</span>
        </div>
      );
    } else if (trend === 'down') {
      return (
        <div className="flex items-center text-red-600">
          <ArrowDownIcon className="h-4 w-4 mr-1" />
          <span>{change}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-600">
          <span>{change}%</span>
        </div>
      );
    }
  };
  
  // Datele pentru graficele principale
  const lineChartData = [
    { date: '2025-01-01', revenue: 12400, expenses: 8200, profit: 4200 },
    { date: '2025-02-01', revenue: 13100, expenses: 8400, profit: 4700 },
    { date: '2025-03-01', revenue: 13800, expenses: 8600, profit: 5200 },
    { date: '2025-04-01', revenue: 14200, expenses: 8800, profit: 5400 },
    { date: '2025-05-01', revenue: 15000, expenses: 9100, profit: 5900 },
    { date: '2025-06-01', revenue: 16200, expenses: 9500, profit: 6700 },
    { date: '2025-07-01', revenue: 17500, expenses: 10100, profit: 7400 },
    { date: '2025-08-01', revenue: 18600, expenses: 10800, profit: 7800 },
    { date: '2025-09-01', revenue: 19200, expenses: 11300, profit: 7900 },
    { date: '2025-10-01', revenue: 20400, expenses: 11800, profit: 8600 },
    { date: '2025-11-01', revenue: 21500, expenses: 12600, profit: 8900 },
    { date: '2025-12-01', revenue: 22800, expenses: 13200, profit: 9600 },
  ];
  
  // Datele pentru metrici
  const financialMetrics = isLoading ? [] : [
    {
      id: 'revenue',
      title: 'Venituri totale',
      value: summary?.kpis?.sales?.value || 0,
      change: 12.5,
      icon: <DollarSign className="h-4 w-4" />,
      trend: 'up',
      targetValue: 25000,
      targetPercent: 91,
      timeframe: 'Luna curentă',
      variant: 'success',
      sparklineData: miniChartData
    },
    {
      id: 'expenses',
      title: 'Cheltuieli totale',
      value: summary?.kpis?.profit?.value || 0,
      change: 8.2,
      icon: <Wallet className="h-4 w-4" />,
      trend: 'up',
      targetValue: 15000,
      targetPercent: 88,
      timeframe: 'Luna curentă',
      variant: 'warning',
      sparklineData: miniChartData
    },
    {
      id: 'profit',
      title: 'Profit net',
      value: summary?.kpis?.profit?.value || 0,
      change: 15.7,
      icon: <TrendingUp className="h-4 w-4" />,
      trend: 'up',
      targetValue: 10000,
      targetPercent: 96,
      timeframe: 'Luna curentă',
      variant: 'info',
      sparklineData: miniChartData
    },
    {
      id: 'growth',
      title: 'Rată creștere',
      value: `${summary?.kpis?.customers?.change || 0}%`,
      change: 2.1,
      icon: <BarChart4 className="h-4 w-4" />,
      trend: 'up',
      targetValue: 20,
      targetPercent: 75,
      timeframe: 'Vs. luna anterioară',
      variant: 'default',
      sparklineData: miniChartData
    }
  ];
  
  const salesMetrics = isLoading ? [] : [
    {
      id: 'totalSales',
      title: 'Comenzi procesate',
      value: summary?.kpis?.orders?.value || 0,
      change: 9.3,
      icon: <ShoppingCart className="h-4 w-4" />,
      trend: 'up',
      targetValue: 500,
      targetPercent: 84,
      timeframe: 'Luna curentă',
      variant: 'success',
      sparklineData: miniChartData
    },
    {
      id: 'averageOrderValue',
      title: 'Valoare medie comandă',
      value: formatCurrency(summary?.kpis?.orders?.change || 0),
      change: -1.8,
      icon: <BarChartHorizontal className="h-4 w-4" />,
      trend: 'down',
      targetValue: 500,
      targetPercent: 85,
      timeframe: 'Luna curentă',
      variant: 'warning',
      sparklineData: miniChartData
    },
    {
      id: 'conversionRate',
      title: 'Rată conversie',
      value: `${summary?.kpis?.conversions?.value || 0}%`,
      change: 1.2,
      icon: <Target className="h-4 w-4" />,
      trend: 'up',
      targetValue: 5,
      targetPercent: 90,
      timeframe: 'Luna curentă',
      variant: 'info',
      sparklineData: miniChartData
    },
    {
      id: 'activeCarts',
      title: 'Coșuri active',
      value: summary?.kpis?.carts?.value || 0,
      change: 3.5,
      icon: <ShoppingCart className="h-4 w-4" />,
      trend: 'up',
      targetValue: 150,
      targetPercent: 73,
      timeframe: 'Acum',
      variant: 'default',
      sparklineData: miniChartData
    }
  ];
  
  const operationsMetrics = isLoading ? [] : [
    {
      id: 'activeProjects',
      title: 'Proiecte active',
      value: summary?.kpis?.projects?.value || 0,
      change: 0,
      icon: <ClipboardCheck className="h-4 w-4" />,
      trend: 'neutral',
      targetValue: 15,
      targetPercent: 87,
      timeframe: 'Acum',
      variant: 'success',
      sparklineData: miniChartData
    },
    {
      id: 'completedTasks',
      title: 'Sarcini finalizate',
      value: summary?.kpis?.tasks?.value || 0,
      change: 24.5,
      icon: <FileText className="h-4 w-4" />,
      trend: 'up',
      targetValue: 300,
      targetPercent: 93,
      timeframe: 'Luna curentă',
      variant: 'info',
      sparklineData: miniChartData
    },
    {
      id: 'pendingTasks',
      title: 'Sarcini în așteptare',
      value: summary?.kpis?.pendingTasks?.value || 0,
      change: -8.3,
      icon: <CalendarClock className="h-4 w-4" />,
      trend: 'down',
      targetValue: 50,
      targetPercent: 65,
      timeframe: 'Acum',
      variant: 'warning',
      sparklineData: miniChartData
    },
    {
      id: 'avgCompletionTime',
      title: 'Timp mediu finalizare',
      value: `${summary?.kpis?.completionTime?.value || 0} ore`,
      change: -4.7,
      icon: <Clock className="h-4 w-4" />,
      trend: 'down',
      targetValue: 24,
      targetPercent: 80,
      timeframe: 'Luna curentă',
      variant: 'default',
      sparklineData: miniChartData
    }
  ];
  
  const inventoryMetrics = isLoading ? [] : [
    {
      id: 'totalItems',
      title: 'Articole în stoc',
      value: summary?.kpis?.inventoryItems?.value || 0,
      change: 3.8,
      icon: <Package className="h-4 w-4" />,
      trend: 'up',
      targetValue: 2000,
      targetPercent: 95,
      timeframe: 'Acum',
      variant: 'success',
      sparklineData: miniChartData
    },
    {
      id: 'lowStock',
      title: 'Articole stoc redus',
      value: summary?.kpis?.lowStock?.value || 0,
      change: -15.2,
      icon: <TrendingDown className="h-4 w-4" />,
      trend: 'down',
      targetValue: 20,
      targetPercent: 70,
      timeframe: 'Acum',
      variant: 'warning',
      sparklineData: miniChartData
    },
    {
      id: 'outOfStock',
      title: 'Articole epuizate',
      value: summary?.kpis?.outOfStock?.value || 0,
      change: -10.5,
      icon: <Eye className="h-4 w-4" />,
      trend: 'down',
      targetValue: 5,
      targetPercent: 60,
      timeframe: 'Acum',
      variant: 'danger',
      sparklineData: miniChartData
    },
    {
      id: 'stockValue',
      title: 'Valoare stoc',
      value: formatCurrency(summary?.kpis?.stockValue?.value || 0),
      change: 5.3,
      icon: <DollarSign className="h-4 w-4" />,
      trend: 'up',
      targetValue: 500000,
      targetPercent: 85,
      timeframe: 'Acum',
      variant: 'info',
      sparklineData: miniChartData
    }
  ];
  
  const marketingMetrics = isLoading ? [] : [
    {
      id: 'campaigns',
      title: 'Campanii active',
      value: summary?.kpis?.campaigns?.value || 0,
      change: 33.3,
      icon: <MessageCircle className="h-4 w-4" />,
      trend: 'up',
      targetValue: 15,
      targetPercent: 80,
      timeframe: 'Acum',
      variant: 'success',
      sparklineData: miniChartData
    },
    {
      id: 'leads',
      title: 'Lead-uri noi',
      value: summary?.kpis?.leads?.value || 0,
      change: 18.7,
      icon: <UserPlus className="h-4 w-4" />,
      trend: 'up',
      targetValue: 200,
      targetPercent: 75,
      timeframe: 'Luna curentă',
      variant: 'info',
      sparklineData: miniChartData
    },
    {
      id: 'conversion',
      title: 'Rată conversie marketing',
      value: `${summary?.kpis?.conversion?.value || 0}%`,
      change: 0.9,
      icon: <Target className="h-4 w-4" />,
      trend: 'up',
      targetValue: 8,
      targetPercent: 62,
      timeframe: 'Luna curentă',
      variant: 'warning',
      sparklineData: miniChartData
    },
    {
      id: 'cac',
      title: 'Cost achiziție client',
      value: formatCurrency(summary?.kpis?.cac?.value || 0),
      change: -3.2,
      icon: <DollarSign className="h-4 w-4" />,
      trend: 'down',
      targetValue: 100,
      targetPercent: 85,
      timeframe: 'Luna curentă',
      variant: 'danger',
      sparklineData: miniChartData
    }
  ];
  
  // Combină toate categoriile de metrici
  const allMetrics = [
    ...financialMetrics,
    ...salesMetrics,
    ...operationsMetrics,
    ...inventoryMetrics,
    ...marketingMetrics
  ];
  
  // Filtrează metricile în funcție de categorie și termen de căutare
  const filteredMetrics = allMetrics.filter(metric => {
    const matchesCategory = category === 'all' || 
      (category === 'financial' && financialMetrics.some(m => m.id === metric.id)) ||
      (category === 'sales' && salesMetrics.some(m => m.id === metric.id)) ||
      (category === 'operations' && operationsMetrics.some(m => m.id === metric.id)) ||
      (category === 'inventory' && inventoryMetrics.some(m => m.id === metric.id)) ||
      (category === 'marketing' && marketingMetrics.some(m => m.id === metric.id));
    
    const matchesSearch = !searchTerm || 
      metric.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  // Funcție pentru afișarea TargetProgress
  const TargetProgress = ({ value, max, percent }: { value: number, max: number, percent: number }) => {
    return (
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1 text-xs text-muted-foreground">
          <span>Obiectiv:</span>
          <span>{value.toLocaleString()} / {max.toLocaleString()}</span>
        </div>
        <Progress value={percent} className="h-1.5" />
      </div>
    );
  };
  
  // Funcție pentru afișarea metricii ca card
  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon, 
    trend, 
    targetValue,
    targetPercent,
    sparklineData,
    timeframe,
    variant = 'default'
  }: MetricCardProps) => {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium flex items-center">
              <span className={`
                mr-2 
                ${variant === 'success' ? 'text-green-600' : 
                  variant === 'warning' ? 'text-amber-600' : 
                  variant === 'danger' ? 'text-red-600' : 
                  variant === 'info' ? 'text-blue-600' : 
                  'text-primary'}
              `}>
                {icon}
              </span>
              {title}
            </CardTitle>
            {renderTrendIcon(trend, change)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {timeframe && (
            <p className="text-xs text-muted-foreground">{timeframe}</p>
          )}
          {targetValue && targetPercent && (
            <TargetProgress value={parseFloat(value.toString())} max={targetValue} percent={targetPercent} />
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <AnalyticsLayout activeTab="metrics">
      <div className="space-y-6">
        {/* Header și filtru */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">KPI Dashboard</h2>
          <p className="text-muted-foreground">
            Monitorizați indicatorii de performanță cheie pentru afacerea dvs.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selectați perioada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Ultima zi</SelectItem>
              <SelectItem value="week">Ultima săptămână</SelectItem>
              <SelectItem value="month">Ultima lună</SelectItem>
              <SelectItem value="quarter">Ultimul trimestru</SelectItem>
              <SelectItem value="year">Ultimul an</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Rezumatul KPI-urilor principale */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsOverviewCard
          title="Venituri"
          value={isLoading ? "..." : formatCurrency(summary?.kpis?.sales?.value || 0)}
          description="Față de luna precedentă"
          icon={<DollarSign className="h-4 w-4" />}
          change={12.5}
          trend="up"
          data={miniChartData}
          variant="success"
        />
        
        <AnalyticsOverviewCard
          title="Comenzi"
          value={isLoading ? "..." : summary?.kpis?.orders?.value?.toString() || "0"}
          description={`Valoare medie: ${isLoading ? "..." : formatCurrency(summary?.kpis?.orders?.change || 0)}`}
          icon={<ShoppingCart className="h-4 w-4" />}
          change={9.3}
          trend="up"
          data={miniChartData}
          variant="info"
        />
        
        <AnalyticsOverviewCard
          title="Rata de conversie"
          value={isLoading ? "..." : `${summary?.kpis?.conversions?.value || 0}%`}
          description="Față de obiectivul de 4.5%"
          icon={<Target className="h-4 w-4" />}
          change={1.2}
          trend="up"
          data={miniChartData}
          variant="warning"
        />
        
        <AnalyticsOverviewCard
          title="Timp de finalizare"
          value={isLoading ? "..." : `${summary?.kpis?.completionTime?.value || 0} ore`}
          description="Timp mediu pentru sarcini"
          icon={<Clock className="h-4 w-4" />}
          change={-4.7}
          trend="down"
          data={miniChartData}
          variant="default"
        />
      </div>
      
      {/* Grafic evoluție metrici */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evoluție financiară</CardTitle>
              <CardDescription>Venituri, cheltuieli și profit</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8">
                <Download className="h-4 w-4 mr-1" />
                <span>Export</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-4 w-4 mr-1" />
                <span>Filtre</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={lineChartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0CA437" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0CA437" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F69008" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F69008" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('ro-RO', { month: 'short' });
                  }} 
                />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' });
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  name="Venituri"
                  stroke="#0CA437" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stackId="2"
                  name="Cheltuieli"
                  stroke="#F69008" 
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stackId="3"
                  name="Profit"
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs cu categorii de metrici */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <TabsList className="mb-0">
            <TabsTrigger value="all">Toate</TabsTrigger>
            <TabsTrigger value="financial">Financiar</TabsTrigger>
            <TabsTrigger value="sales">Vânzări</TabsTrigger>
            <TabsTrigger value="operations">Operațional</TabsTrigger>
            <TabsTrigger value="inventory">Inventar</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Căutare metrici..."
                className="pl-9 w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex border rounded-md">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-9 w-9 rounded-none rounded-l-md ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Grid view</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-9 w-9 rounded-none rounded-r-md ${viewMode === 'list' ? 'bg-muted' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
                <span className="sr-only">List view</span>
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="h-9">
              <FilePlus2 className="h-4 w-4 mr-1" />
              <span>Metrică nouă</span>
            </Button>
          </div>
        </div>
        
        {/* Conținut tabs */}
        <TabsContent value="all">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-1/4 mb-4" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMetrics.length === 0 ? (
            <AnalyticsEmptyState
              title="Nicio metrică găsită"
              description="Nu există metrici care să corespundă criteriilor de căutare."
              icon={<BarChart4 className="h-full w-full" />}
              variant="card"
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredMetrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  icon={metric.icon}
                  trend={metric.trend}
                  targetValue={metric.targetValue}
                  targetPercent={metric.targetPercent}
                  sparklineData={metric.sparklineData}
                  timeframe={metric.timeframe}
                  variant={metric.variant}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nume metrică</TableHead>
                    <TableHead>Valoare</TableHead>
                    <TableHead>Schimbare</TableHead>
                    <TableHead>Perioadă</TableHead>
                    <TableHead>Obiectiv</TableHead>
                    <TableHead>Progres</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMetrics.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <span className={`
                            mr-2 
                            ${metric.variant === 'success' ? 'text-green-600' : 
                              metric.variant === 'warning' ? 'text-amber-600' : 
                              metric.variant === 'danger' ? 'text-red-600' : 
                              metric.variant === 'info' ? 'text-blue-600' : 
                              'text-primary'}
                          `}>
                            {metric.icon}
                          </span>
                          {metric.title}
                        </div>
                      </TableCell>
                      <TableCell>{metric.value}</TableCell>
                      <TableCell>
                        {renderTrendIcon(metric.trend, metric.change)}
                      </TableCell>
                      <TableCell>{metric.timeframe}</TableCell>
                      <TableCell>
                        {metric.targetValue ? metric.targetValue.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="w-[120px]">
                        {metric.targetPercent ? (
                          <div className="flex items-center gap-2">
                            <Progress value={metric.targetPercent} className="h-1.5 flex-1" />
                            <span className="text-xs">{metric.targetPercent}%</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="financial">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {financialMetrics.map((metric) => (
              <MetricCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                icon={metric.icon}
                trend={metric.trend}
                targetValue={metric.targetValue}
                targetPercent={metric.targetPercent}
                sparklineData={metric.sparklineData}
                timeframe={metric.timeframe}
                variant={metric.variant}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="sales">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {salesMetrics.map((metric) => (
              <MetricCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                icon={metric.icon}
                trend={metric.trend}
                targetValue={metric.targetValue}
                targetPercent={metric.targetPercent}
                sparklineData={metric.sparklineData}
                timeframe={metric.timeframe}
                variant={metric.variant}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="operations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {operationsMetrics.map((metric) => (
              <MetricCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                icon={metric.icon}
                trend={metric.trend}
                targetValue={metric.targetValue}
                targetPercent={metric.targetPercent}
                sparklineData={metric.sparklineData}
                timeframe={metric.timeframe}
                variant={metric.variant}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="inventory">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {inventoryMetrics.map((metric) => (
              <MetricCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                icon={metric.icon}
                trend={metric.trend}
                targetValue={metric.targetValue}
                targetPercent={metric.targetPercent}
                sparklineData={metric.sparklineData}
                timeframe={metric.timeframe}
                variant={metric.variant}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="marketing">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketingMetrics.map((metric) => (
              <MetricCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                icon={metric.icon}
                trend={metric.trend}
                targetValue={metric.targetValue}
                targetPercent={metric.targetPercent}
                sparklineData={metric.sparklineData}
                timeframe={metric.timeframe}
                variant={metric.variant}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Footer cu acțiuni */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Actualizat ultima dată: {new Date().toLocaleString('ro-RO')}
        </p>
        <Button variant="outline" asChild>
          <Link href="/analytics/metrics/customize">
            Personalizează metrici
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      </div>
    </AnalyticsLayout>
  );
}