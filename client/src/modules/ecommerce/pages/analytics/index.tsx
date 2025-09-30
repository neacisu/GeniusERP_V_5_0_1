/**
 * E-commerce Analytics Page
 * 
 * This page provides comprehensive analytics and insights for the online store,
 * including sales data, customer behavior, product performance, and more.
 */

import React, { useState } from 'react';
import { EcommerceModuleLayout } from '../../components/common/EcommerceModuleLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Package,
  BarChart2,
  ArrowRight,
  Activity,
  Eye,
  ShoppingBag,
  Clock,
  Map,
  Smartphone,
  Laptop,
  Tablet
} from 'lucide-react';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Helper function for formatting numbers in chart tooltips
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Overview metrics
  const metrics = {
    totalSales: "134,892 RON",
    salesGrowth: "+12.5%",
    totalOrders: "427",
    ordersGrowth: "+8.2%",
    averageOrderValue: "315.91 RON",
    aovGrowth: "+3.6%",
    conversionRate: "3.2%",
    conversionGrowth: "+0.4%"
  };
  
  // Sales By Day
  const salesByDay = [
    { name: 'Lun', value: 21450 },
    { name: 'Mar', value: 18390 },
    { name: 'Mie', value: 24800 },
    { name: 'Joi', value: 16908 },
    { name: 'Vin', value: 22800 },
    { name: 'Sâm', value: 16700 },
    { name: 'Dum', value: 13844 },
  ];
  
  // Orders By Day
  const ordersByDay = [
    { name: 'Lun', value: 68 },
    { name: 'Mar', value: 57 },
    { name: 'Mie', value: 78 },
    { name: 'Joi', value: 52 },
    { name: 'Vin', value: 71 },
    { name: 'Sâm', value: 54 },
    { name: 'Dum', value: 47 },
  ];
  
  // Sales by Category (Pie Chart)
  const salesByCategory = [
    { name: 'Îmbrăcăminte', value: 45600 },
    { name: 'Încălțăminte', value: 32400 },
    { name: 'Accesorii', value: 18700 },
    { name: 'Electronice', value: 26300 },
    { name: 'Casă & Grădină', value: 11892 },
  ];
  
  // Sales by Region (Bar Chart)
  const salesByRegion = [
    { name: 'București', value: 42300 },
    { name: 'Cluj', value: 23560 },
    { name: 'Iași', value: 17420 },
    { name: 'Timișoara', value: 15290 },
    { name: 'Constanța', value: 13650 },
    { name: 'Brașov', value: 12780 },
    { name: 'Alte', value: 9892 },
  ];
  
  // Customer Devices (Pie Chart)
  const deviceData = [
    { name: 'Mobile', value: 62 },
    { name: 'Desktop', value: 30 },
    { name: 'Tablet', value: 8 },
  ];
  
  // Top Products
  const topProducts = [
    { name: 'Tricou personalizat', category: 'Îmbrăcăminte', sales: '12,450 RON', qty: 83, growth: '+15%' },
    { name: 'Adidași sport', category: 'Încălțăminte', sales: '10,780 RON', qty: 45, growth: '+12%' },
    { name: 'Geantă laptop', category: 'Accesorii', sales: '8,920 RON', qty: 38, growth: '+8%' },
    { name: 'Căști wireless', category: 'Electronice', sales: '8,540 RON', qty: 32, growth: '+22%' },
    { name: 'Set cafea', category: 'Casă & Grădină', sales: '6,350 RON', qty: 27, growth: '+5%' },
  ];
  
  // Customer Insights
  const customerInsights = [
    { name: 'Clienți noi', value: 156, growth: '+13%', icon: <Users className="h-5 w-5 text-blue-500" /> },
    { name: 'Clienți recurenți', value: 271, growth: '+8%', icon: <ShoppingCart className="h-5 w-5 text-green-500" /> },
    { name: 'Timp mediu pe site', value: '4m 36s', growth: '+12%', icon: <Clock className="h-5 w-5 text-orange-500" /> },
    { name: 'Valoare medie client', value: '485 RON', growth: '+9%', icon: <DollarSign className="h-5 w-5 text-purple-500" /> },
  ];

  // Time series data (last 30 days)
  const timeSeriesData = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1 <= 9 ? '0' : ''}${i + 1}/04`,
    sales: Math.floor(Math.random() * 3000) + 2000,
    orders: Math.floor(Math.random() * 20) + 10,
  })).reverse();
  
  // Chart colors
  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  const deviceColors = ['#0088FE', '#00C49F', '#FFBB28'];
  
  return (
    <EcommerceModuleLayout activeTab="analytics">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Analiză</h1>
            <p className="text-muted-foreground">Date și statistici despre magazinul online</p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selectează perioada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Ultimele 7 zile</SelectItem>
                <SelectItem value="30d">Ultimele 30 zile</SelectItem>
                <SelectItem value="3m">Ultimele 3 luni</SelectItem>
                <SelectItem value="6m">Ultimele 6 luni</SelectItem>
                <SelectItem value="1y">Ultimul an</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
            <TabsTrigger value="overview">Privire Generală</TabsTrigger>
            <TabsTrigger value="sales">Vânzări</TabsTrigger>
            <TabsTrigger value="customers">Clienți</TabsTrigger>
            <TabsTrigger value="products">Produse</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vânzări Totale</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalSales}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className={`text-${metrics.salesGrowth.startsWith('+') ? 'green' : 'red'}-500 inline-flex items-center`}>
                      {metrics.salesGrowth.startsWith('+') ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                      {metrics.salesGrowth}
                    </span>
                    {' '}față de perioada anterioară
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comenzi Totale</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalOrders}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className={`text-${metrics.ordersGrowth.startsWith('+') ? 'green' : 'red'}-500 inline-flex items-center`}>
                      {metrics.ordersGrowth.startsWith('+') ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                      {metrics.ordersGrowth}
                    </span>
                    {' '}față de perioada anterioară
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valoare Medie Comandă</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.averageOrderValue}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className={`text-${metrics.aovGrowth.startsWith('+') ? 'green' : 'red'}-500 inline-flex items-center`}>
                      {metrics.aovGrowth.startsWith('+') ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                      {metrics.aovGrowth}
                    </span>
                    {' '}față de perioada anterioară
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rată Conversie</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.conversionRate}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className={`text-${metrics.conversionGrowth.startsWith('+') ? 'green' : 'red'}-500 inline-flex items-center`}>
                      {metrics.conversionGrowth.startsWith('+') ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                      {metrics.conversionGrowth}
                    </span>
                    {' '}față de perioada anterioară
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-7">
              <Card className="md:col-span-4">
                <CardHeader>
                  <CardTitle>Vânzări și Comenzi</CardTitle>
                  <CardDescription>
                    Evoluția vânzărilor și comenzilor în ultimele 30 de zile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'sales') return [`${formatNumber(value as number)}`, 'Vânzări'];
                            return [value, 'Comenzi'];
                          }}
                        />
                        <Legend formatter={(value) => value === 'sales' ? 'Vânzări' : 'Comenzi'} />
                        <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Vânzări pe Categorii</CardTitle>
                  <CardDescription>
                    Distribuția vânzărilor pe categorii de produse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Produse</CardTitle>
                  <CardDescription>
                    Cele mai bine vândute produse în perioada selectată
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, i) => (
                      <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                        <div className="ml-auto flex flex-col items-end">
                          <p className="text-sm font-medium">{product.sales}</p>
                          <p className="text-xs text-muted-foreground">{product.qty} unități</p>
                        </div>
                        <div className="ml-4">
                          <Badge className="bg-green-100 text-green-800">{product.growth}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    Vezi toate produsele
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Informații Clienți</CardTitle>
                  <CardDescription>
                    Statistici despre comportamentul clienților
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customerInsights.map((insight, i) => (
                      <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {insight.icon}
                          </div>
                          <p className="text-sm font-medium">{insight.name}</p>
                        </div>
                        <div className="ml-auto flex flex-col items-end">
                          <p className="text-sm font-medium">{insight.value}</p>
                          <p className="text-xs text-green-600">{insight.growth}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Vezi raport detaliat
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-7">
              <Card className="md:col-span-4">
                <CardHeader>
                  <CardTitle>Vânzări pe Regiuni</CardTitle>
                  <CardDescription>
                    Distribuția geografică a vânzărilor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesByRegion} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(value) => formatNumber(value as number)} />
                        <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                          {salesByRegion.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Dispozitive</CardTitle>
                    <CardDescription>
                      Distribuția comenzilor pe tipuri de dispozitive
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Smartphone className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Laptop className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Tablet className="h-4 w-4 text-yellow-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {deviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={deviceColors[index % deviceColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Vânzări Zilnice Medii</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">19,270 RON</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +5.2% față de săptămâna trecută
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Produse Vândute</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">583</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +12.3% față de săptămâna trecută
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Rată Abandon Coș</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">32.8%</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
                    -3.5% față de săptămâna trecută
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Discount Mediu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">15.2%</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    +2.1% față de săptămâna trecută
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Vânzări pe Zile ale Săptămânii</CardTitle>
                <CardDescription>
                  Analiza vânzărilor pe zile pentru identificarea tendințelor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatNumber(value as number)} />
                      <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                        {salesByDay.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vânzări pe Ore</CardTitle>
                  <CardDescription>
                    Distribuția vânzărilor pe intervale orare
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          {name: '00-04', value: 1250},
                          {name: '04-08', value: 2100},
                          {name: '08-12', value: 15300},
                          {name: '12-16', value: 23800},
                          {name: '16-20', value: 35200},
                          {name: '20-24', value: 18700}
                        ]} 
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatNumber(value as number)} />
                        <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Metode de Plată</CardTitle>
                  <CardDescription>
                    Distribuția vânzărilor după metoda de plată
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {name: 'Card', value: 78500},
                            {name: 'Ramburs', value: 36400},
                            {name: 'Transfer bancar', value: 12700},
                            {name: 'PayPal', value: 7292}
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Total Clienți</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,245</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +8.7% față de luna trecută
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Clienți Noi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +12.4% față de luna trecută
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Rată Retenție</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">68.5%</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +3.2% față de luna trecută
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Valoare Medie Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">485 RON</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +4.5% față de luna trecută
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
              <Card className="md:col-span-4">
                <CardHeader>
                  <CardTitle>Clienți Noi vs. Recurenți</CardTitle>
                  <CardDescription>
                    Evoluția clienților noi și recurenți în timp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={Array.from({ length: 30 }, (_, i) => ({
                          date: `${i + 1 <= 9 ? '0' : ''}${i + 1}/04`,
                          new: Math.floor(Math.random() * 10) + 3,
                          returning: Math.floor(Math.random() * 15) + 5,
                        })).reverse()} 
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend formatter={(value) => value === 'new' ? 'Clienți Noi' : 'Clienți Recurenți'} />
                        <Line type="monotone" dataKey="new" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="returning" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Clienți pe Surse</CardTitle>
                  <CardDescription>
                    Distribuția clienților după sursa de achiziție
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {name: 'Direct', value: 280},
                            {name: 'Google', value: 425},
                            {name: 'Facebook', value: 210},
                            {name: 'Instagram', value: 180},
                            {name: 'Referral', value: 150},
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Loialitate Clienți</CardTitle>
                <CardDescription>
                  Distribuția clienților pe segmente de loialitate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Premium (&gt;5 comenzi)</span>
                      <span>165 clienți (13.3%)</span>
                    </div>
                    <Progress value={13.3} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Regulat (3-5 comenzi)</span>
                      <span>310 clienți (24.9%)</span>
                    </div>
                    <Progress value={24.9} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Ocazional (2 comenzi)</span>
                      <span>285 clienți (22.9%)</span>
                    </div>
                    <Progress value={22.9} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Unică (1 comandă)</span>
                      <span>485 clienți (38.9%)</span>
                    </div>
                    <Progress value={38.9} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Produse Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">427</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +12 produse noi luna aceasta
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Produse în Stoc</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">392</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <Package className="h-3 w-3 mr-1" />
                    91.8% din total produse
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Produse Vândute</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">583</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <ShoppingBag className="h-3 w-3 mr-1 text-green-500" />
                    +14.2% față de luna trecută
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Rată Conversie Produs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.2%</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +0.3% față de luna trecută
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performanță pe Categorii</CardTitle>
                <CardDescription>
                  Vânzări și conversii pentru fiecare categorie de produse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        {name: 'Îmbrăcăminte', sales: 45600, conversion: 4.8},
                        {name: 'Încălțăminte', sales: 32400, conversion: 4.2},
                        {name: 'Accesorii', sales: 18700, conversion: 3.5},
                        {name: 'Electronice', sales: 26300, conversion: 3.2},
                        {name: 'Casă & Grădină', sales: 11892, conversion: 2.8}
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'sales') return [formatNumber(value as number), 'Vânzări'];
                          return [`${value}%`, 'Conversie'];
                        }}
                      />
                      <Legend formatter={(value) => value === 'sales' ? 'Vânzări' : 'Rată Conversie'} />
                      <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="sales" />
                      <Bar yAxisId="right" dataKey="conversion" fill="#82ca9d" name="conversion" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Produse cu Cele Mai Multe Vizualizări</CardTitle>
                  <CardDescription>
                    Produsele cele mai populare după numărul de vizualizări
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {name: 'Tricou personalizat', views: 4250, conversion: '3.8%'},
                      {name: 'Adidași sport', views: 3820, conversion: '2.9%'},
                      {name: 'Geantă laptop', views: 3150, conversion: '2.7%'},
                      {name: 'Căști wireless', views: 2980, conversion: '3.5%'},
                      {name: 'Set cafea', views: 2640, conversion: '2.2%'},
                    ].map((product, i) => (
                      <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Rată conversie: {product.conversion}</p>
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">{product.views.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Stoc Limitat</CardTitle>
                  <CardDescription>
                    Produse care necesită reaprovizionare
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {name: 'Pantofi de alergare', stock: 3, demand: 'Ridicată'},
                      {name: 'Cană personalizată', stock: 5, demand: 'Medie'},
                      {name: 'Pernă decorativă', stock: 2, demand: 'Medie'},
                      {name: 'Mouse wireless', stock: 4, demand: 'Ridicată'},
                      {name: 'Baterie externă', stock: 1, demand: 'Ridicată'},
                    ].map((product, i) => (
                      <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Cerere: {product.demand}</p>
                        </div>
                        <div>
                          <Badge className={product.stock <= 2 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                            Stoc: {product.stock} buc
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full">
                    <Package className="mr-2 h-4 w-4" />
                    Gestionare stoc
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </EcommerceModuleLayout>
  );
}