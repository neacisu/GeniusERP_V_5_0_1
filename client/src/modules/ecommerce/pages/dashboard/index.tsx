/**
 * E-commerce Dashboard Page
 * 
 * This page displays key metrics and overview of e-commerce operations,
 * including sales data, order stats, and performance indicators.
 */

import React from 'react';
import { EcommerceModuleLayout } from '../../components/common/EcommerceModuleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, ShoppingCart, Package, RefreshCw, 
  DollarSign, Users, Calendar, BarChart2
} from 'lucide-react';

export default function DashboardPage() {
  const [dateRange, setDateRange] = React.useState('7d');
  
  // Placeholder data - in a real implementation, this would come from an API
  const revenueData = [
    { name: 'Lun', value: 2400 },
    { name: 'Mar', value: 1398 },
    { name: 'Mie', value: 9800 },
    { name: 'Joi', value: 3908 },
    { name: 'Vin', value: 4800 },
    { name: 'Sâm', value: 3800 },
    { name: 'Dum', value: 4300 },
  ];
  
  const salesByCategory = [
    { name: 'Îmbrăcăminte', value: 400 },
    { name: 'Electronice', value: 300 },
    { name: 'Casă & Grădină', value: 200 },
    { name: 'Altele', value: 100 },
  ];
  
  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  const recentOrders = [
    { id: '#ORD-8945', customer: 'Alexandru Popescu', amount: '299.99', status: 'completed', date: '11 Apr 2025' },
    { id: '#ORD-8944', customer: 'Maria Ionescu', amount: '129.50', status: 'processing', date: '10 Apr 2025' },
    { id: '#ORD-8943', customer: 'Andrei Mihai', amount: '89.99', status: 'completed', date: '10 Apr 2025' },
    { id: '#ORD-8942', customer: 'Elena Vasilescu', amount: '599.99', status: 'pending', date: '09 Apr 2025' },
    { id: '#ORD-8941', customer: 'Cristian Popa', amount: '49.99', status: 'completed', date: '09 Apr 2025' },
  ];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <EcommerceModuleLayout activeTab="dashboard">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selectează perioada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Ultimele 7 zile</SelectItem>
                <SelectItem value="30d">Ultimele 30 zile</SelectItem>
                <SelectItem value="90d">Ultimele 90 zile</SelectItem>
                <SelectItem value="12m">Ultimele 12 luni</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Venituri Totale</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">21,345 RON</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-green-500 inline-flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +12.5%
                </span>
                {' '}față de perioada anterioară
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comenzi</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">145</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-green-500 inline-flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +8.2%
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
              <div className="text-2xl font-bold">147.20 RON</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-red-500 inline-flex items-center">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  -3.1%
                </span>
                {' '}față de perioada anterioară
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clienți Noi</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">58</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-green-500 inline-flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +15.8%
                </span>
                {' '}față de perioada anterioară
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-5">
            <CardHeader>
              <CardTitle>Venituri</CardTitle>
              <CardDescription>
                Veniturile pentru perioada selectată
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Vânzări pe Categorii</CardTitle>
              <CardDescription>
                Distribuția vânzărilor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Comenzi Recente</CardTitle>
              <CardDescription>
                Ultimele 5 comenzi plasate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.customer}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>{order.id}</span>
                          <span className="mx-2">•</span>
                          <span>{order.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{order.amount} RON</div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status === 'completed' && 'Finalizată'}
                          {order.status === 'processing' && 'În procesare'}
                          {order.status === 'pending' && 'În așteptare'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Obiective de Vânzări</CardTitle>
              <CardDescription>
                Progresul vânzărilor față de obiective
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Vânzări Lunare</div>
                    <div className="text-sm font-medium">21,345 / 30,000 RON</div>
                  </div>
                  <Progress value={71} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">71.2%</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Clienți Noi</div>
                    <div className="text-sm font-medium">58 / 100</div>
                  </div>
                  <Progress value={58} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">58%</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Produse Vândute</div>
                    <div className="text-sm font-medium">289 / 500</div>
                  </div>
                  <Progress value={57.8} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">57.8%</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Rata de Conversie</div>
                    <div className="text-sm font-medium">3.2% / 5%</div>
                  </div>
                  <Progress value={64} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">64%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </EcommerceModuleLayout>
  );
}