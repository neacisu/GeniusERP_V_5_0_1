/**
 * Report Detail Page
 * 
 * Pagină pentru vizualizarea unui raport analitic specific,
 * cu grafice, tabele de date și opțiuni de filtrare.
 */

import React, { useState } from 'react';
import { useAnalyticsReports } from '../../hooks/useAnalyticsReports';
import { Link, useParams } from 'wouter';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  AreaChart, 
  ResponsiveContainer,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  Line,
  Area,
  Pie,
  Cell,
} from 'recharts';
import { 
  Calendar, 
  Clock, 
  Download, 
  Edit, 
  FileText, 
  MoreVertical, 
  Play, 
  Printer, 
  RefreshCw, 
  Share2, 
  Sliders, 
  Table as TableIcon,
  BarChart4,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ArrowLeft,
  Filter,
  Eye,
  EyeOff,
  ListFilter,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { useReportQuery, runReport, isRunning } = useAnalyticsReports();
  const { data, isLoading, isError, error } = useReportQuery(id);
  const report = data?.report;
  
  const [timeRange, setTimeRange] = useState('month');
  const [chartType, setChartType] = useState('bar');
  
  // Datele pentru grafic - în producție ar fi înlocuite cu date reale
  const chartData = [
    { name: 'Ian', value: 4000, value2: 2400 },
    { name: 'Feb', value: 3000, value2: 1398 },
    { name: 'Mar', value: 5000, value2: 9800 },
    { name: 'Apr', value: 7000, value2: 3908 },
    { name: 'Mai', value: 6000, value2: 4800 },
    { name: 'Iun', value: 8000, value2: 3800 },
    { name: 'Iul', value: 7800, value2: 4300 },
    { name: 'Aug', value: 9000, value2: 5300 },
    { name: 'Sep', value: 8500, value2: 4300 },
    { name: 'Oct', value: 10000, value2: 6300 },
    { name: 'Nov', value: 9500, value2: 7300 },
    { name: 'Dec', value: 11000, value2: 8300 },
  ];
  
  // Date pentru grafic circular
  const pieData = [
    { name: 'Grupa A', value: 400 },
    { name: 'Grupa B', value: 300 },
    { name: 'Grupa C', value: 300 },
    { name: 'Grupa D', value: 200 },
    { name: 'Grupa E', value: 100 },
  ];
  
  // Culori pentru grafice
  const COLORS = ['#0CA437', '#F69008', '#F7AE2B', '#88C506', '#99D126', '#C80002'];
  
  const handleRunReport = () => {
    if (id) {
      runReport(id);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Venituri" fill="#0CA437" />
            <Bar dataKey="value2" name="Cheltuieli" fill="#F69008" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              name="Venituri"
              stroke="#0CA437" 
              strokeWidth={2}
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="value2" 
              name="Cheltuieli"
              stroke="#F69008" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0CA437" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0CA437" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F69008" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#F69008" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              name="Venituri"
              stroke="#0CA437" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
            <Area 
              type="monotone" 
              dataKey="value2" 
              name="Cheltuieli"
              stroke="#F69008" 
              fillOpacity={1} 
              fill="url(#colorValue2)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    
    return null;
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-full max-w-lg" />
            <Skeleton className="h-4 w-full max-w-xs mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton 
                  key={index} 
                  className="h-12 w-full" 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Eroare la încărcarea raportului</h3>
          <p className="text-muted-foreground mb-6">
            Nu am putut încărca detaliile raportului. Vă rugăm să încercați din nou.
          </p>
          <p className="text-sm text-destructive mb-6">
            {error instanceof Error ? error.message : 'Eroare necunoscută'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/analytics/reports">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi la rapoarte
              </Link>
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Încercați din nou
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  
  if (!report) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Raport negăsit</h3>
          <p className="text-muted-foreground mb-6">
            Raportul solicitat nu există sau nu aveți permisiuni pentru a-l accesa.
          </p>
          <Button variant="outline" asChild>
            <Link href="/analytics/reports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi la rapoarte
            </Link>
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header cu acțiuni */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link href="/analytics/reports">
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Înapoi</span>
              </Button>
            </Link>
            <Badge 
              variant="outline" 
              className={`
                ${report.type === 'financial' ? "bg-green-100 text-green-800" : 
                  report.type === 'sales' ? "bg-blue-100 text-blue-800" : 
                  report.type === 'inventory' ? "bg-purple-100 text-purple-800" : 
                  report.type === 'marketing' ? "bg-orange-100 text-orange-800" : 
                  report.type === 'operations' ? "bg-amber-100 text-amber-800" : 
                  "bg-gray-100 text-gray-800"}
              `}
            >
              {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{report.name}</h1>
          {report.description && (
            <p className="text-muted-foreground mt-1">{report.description}</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="gap-1" 
            onClick={handleRunReport}
            disabled={isRunning}
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{isRunning ? 'Actualizare...' : 'Actualizează'}</span>
          </Button>
          
          <Button variant="outline" className="gap-1">
            <Printer className="h-4 w-4" />
            <span>Printează</span>
          </Button>
          
          <Button variant="outline" className="gap-1">
            <Download className="h-4 w-4" />
            <span>Exportă</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                <MoreVertical className="h-4 w-4" />
                <span>Mai multe</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/analytics/reports/${id}/edit`} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  <span>Editează</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                <span>Partajează</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Sliders className="h-4 w-4 mr-2" />
                <span>Setări</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1.5" />
          <span>Creat la {formatDate(report.createdAt)}</span>
        </div>
        
        {report.lastModified && (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1.5" />
            <span>Actualizat la {formatDate(report.lastModified)}</span>
          </div>
        )}
        
        <div className="flex items-center">
          <Eye className="h-4 w-4 mr-1.5" />
          <span>{report.isPublic ? 'Public' : 'Privat'}</span>
        </div>
        
        {report.schedule && (
          <div className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            <span>Programat {report.schedule.frequency}</span>
          </div>
        )}
      </div>
      
      {/* Chart Tools */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <CardTitle>Vizualizare raport</CardTitle>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <div className="flex items-center border rounded-md">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`rounded-none rounded-l-md ${chartType === 'bar' ? 'bg-secondary' : ''}`}
                  onClick={() => setChartType('bar')}
                >
                  <BarChart4 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`rounded-none ${chartType === 'line' ? 'bg-secondary' : ''}`}
                  onClick={() => setChartType('line')}
                >
                  <LineChartIcon className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`rounded-none ${chartType === 'area' ? 'bg-secondary' : ''}`}
                  onClick={() => setChartType('area')}
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`rounded-none rounded-r-md ${chartType === 'pie' ? 'bg-secondary' : ''}`}
                  onClick={() => setChartType('pie')}
                >
                  <PieChartIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Perioada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Ultima zi</SelectItem>
                  <SelectItem value="week">Ultima săptămână</SelectItem>
                  <SelectItem value="month">Ultima lună</SelectItem>
                  <SelectItem value="quarter">Ultimul trimestru</SelectItem>
                  <SelectItem value="year">Ultimul an</SelectItem>
                  <SelectItem value="custom">Personalizat...</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" className="gap-1 h-9">
                <Filter className="h-4 w-4" />
                <span>Filtre</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-6">
            {renderChart()}
          </div>
        </CardContent>
      </Card>
      
      {/* Report Data Tabs */}
      <Tabs defaultValue="table">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="table" className="gap-1">
              <TableIcon className="h-4 w-4" />
              <span>Tabel</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>Metrici</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1">
              <LineChartIcon className="h-4 w-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" className="gap-1">
            <ListFilter className="h-4 w-4" />
            <span>Filtrează coloane</span>
          </Button>
        </div>
        
        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Luna</TableHead>
                      <TableHead className="text-right">Venituri</TableHead>
                      <TableHead className="text-right">Cheltuieli</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Marjă</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-right">{row.value.toLocaleString()} RON</TableCell>
                        <TableCell className="text-right">{row.value2.toLocaleString()} RON</TableCell>
                        <TableCell className="text-right">{(row.value - row.value2).toLocaleString()} RON</TableCell>
                        <TableCell className="text-right">
                          {((row.value - row.value2) / row.value * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                Afișare 12 din 12 rânduri
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Total venituri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {chartData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()} RON
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Creștere de 18.2% față de perioada precedentă
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Total cheltuieli</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">
                      {chartData.reduce((acc, curr) => acc + curr.value2, 0).toLocaleString()} RON
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Creștere de 7.5% față de perioada precedentă
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Profitabilitate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {(
                        (chartData.reduce((acc, curr) => acc + curr.value, 0) - 
                         chartData.reduce((acc, curr) => acc + curr.value2, 0)) / 
                        chartData.reduce((acc, curr) => acc + curr.value, 0) * 100
                      ).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cu 2.3% mai mare față de obiectivul stabilit
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Performanță vânzări</h3>
                  <p className="text-blue-700">
                    Vânzările au crescut constant în ultimele 6 luni, cu un vârf în luna Decembrie de 11,000 RON.
                    Acest trend indică succesul campaniilor de marketing din Q4.
                  </p>
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="text-lg font-medium text-amber-800 mb-2">Tendințe cheltuieli</h3>
                  <p className="text-amber-700">
                    Cheltuielile au avut o creștere accelerată în ultimele 3 luni. 
                    Recomandăm analizarea mai detaliată a categoriilor de cheltuieli pentru a identifica potențiale economii.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-lg font-medium text-green-800 mb-2">Recomandări</h3>
                  <ul className="text-green-700 list-disc pl-5 space-y-1">
                    <li>Continuați strategiile de marketing care au generat vârful de vânzări din Decembrie</li>
                    <li>Analizați creșterea cheltuielilor din ultimele 3 luni pentru optimizare</li>
                    <li>Mențineți raportul venituri/cheltuieli la nivelul actual sau mai bun</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}