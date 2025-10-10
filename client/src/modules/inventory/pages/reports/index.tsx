/**
 * Inventory Reports Page
 * 
 * Provides access to various inventory reports and analytics.
 */

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useWarehouses, useProducts, useStockItems, useInventoryApi } from "../../hooks/useInventoryApi";

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Charts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Lucide icons
import {
  FileBarChart,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  CalendarIcon,
  FileDown,
  Printer,
  RefreshCcw,
  Warehouse,
  Clock,
  TrendingUp,
  Package,
  ArrowRightLeft,
  FileCheck,
  Loader2,
  FilePlus,
  Pencil
} from "lucide-react";

// Custom components
import PageHeader from "../../components/common/PageHeader";

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Sample data for charts (would be replaced with real data from API)
const stockByWarehouseData = [
  { name: 'Depozit Central', value: 250 },
  { name: 'Magazin București', value: 170 },
  { name: 'Magazin Cluj', value: 120 },
  { name: 'Depozit Secundar', value: 80 },
];

const stockMovementData = [
  { date: '01/04', inputs: 42, outputs: 28 },
  { date: '02/04', inputs: 35, outputs: 22 },
  { date: '03/04', inputs: 50, outputs: 32 },
  { date: '04/04', inputs: 37, outputs: 40 },
  { date: '05/04', inputs: 45, outputs: 35 },
  { date: '06/04', inputs: 52, outputs: 30 },
  { date: '07/04', inputs: 38, outputs: 27 },
];

const topProductsData = [
  { name: 'Produs A', quantity: 420 },
  { name: 'Produs B', quantity: 380 },
  { name: 'Produs C', quantity: 290 },
  { name: 'Produs D', quantity: 250 },
  { name: 'Produs E', quantity: 220 },
];

const reportsList = [
  { id: 'stock-value', name: 'Valoare stocuri pe gestiuni', icon: Warehouse, description: 'Raport detaliat cu valoarea totală a stocurilor pe fiecare gestiune' },
  { id: 'stock-movement', name: 'Mișcări de stoc', icon: ArrowRightLeft, description: 'Raport privind intrările și ieșirile de produse din stoc' },
  { id: 'low-stock', name: 'Produse cu stoc minim', icon: Package, description: 'Lista produselor care au atins sau sunt sub nivelul de stoc minim' },
  { id: 'stock-age', name: 'Vechime stocuri', icon: Clock, description: 'Analiză a vechimii stocurilor pe perioade predefinite' },
  { id: 'nir-summary', name: 'Centralizator NIR', icon: FileCheck, description: 'Raport centralizator al documentelor de recepție pe perioade' },
  { id: 'stock-rotation', name: 'Rotație stocuri', icon: RefreshCcw, description: 'Indicatori privind viteza de rotație a stocurilor' },
  { id: 'stock-forecast', name: 'Prognoză stocuri', icon: TrendingUp, description: 'Estimări ale evoluției stocurilor în următoarea perioadă' },
];

const InventoryReportsPage: React.FC = () => {
  const [location] = useLocation();
  
  // Extract tab from URL query parameters
  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.split('?')[1]);
    const tabParam = params.get('tab');
    
    // Map the tab parameter to the correct value
    if (tabParam === 'inventariere') {
      return 'assessment';  // Tab value for inventory assessment
    }
    
    return null;  // Return null if no tab specified
  };
  
  // Initialize with default tab, will be updated in useEffect if needed
  const [activeTab, setActiveTab] = useState("overview");

  // Listen for URL changes to update the tab
  useEffect(() => {
    const tabFromUrl = getTabFromUrl();
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [location]);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const [isGenerating, setIsGenerating] = useState(false);
  
  // Simulating report generation
  const generateReport = () => {
    if (!selectedReport) return;
    
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsGenerating(false);
      // In a real implementation, this would fetch and display the report data
    }, 1500);
  };
  
  // Get inventory assessment data from API
  const { 
    assessments, 
    isLoadingAssessments, 
    refetchAssessments,
    rawAssessmentData
  } = useInventoryApi();
  
  // Handler for loading inventory assessment data
  const handleLoadAssessmentData = () => {
    refetchAssessments();
  };
  
  // For debugging
  console.log("Raw assessment data:", rawAssessmentData);
  
  // Use effect to handle data initialization
  useEffect(() => {
    // Immediately fetch assessment data when the component mounts
    refetchAssessments();
  }, [refetchAssessments]);
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Rapoarte Gestiune" 
        description="Analize și rapoarte pentru gestiunea stocurilor"
      />
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Prezentare Generală
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center">
            <FileBarChart className="h-4 w-4 mr-2" />
            Rapoarte
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center">
            <FileCheck className="h-4 w-4 mr-2" />
            Inventariere
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Distribuția stocurilor pe gestiuni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockByWarehouseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stockByWarehouseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChartIcon className="h-5 w-5 mr-2 text-green-500" />
                  Evoluția mișcărilor de stoc
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stockMovementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="inputs" stroke="#0088FE" activeDot={{ r: 8 }} name="Intrări" />
                      <Line type="monotone" dataKey="outputs" stroke="#FF8042" name="Ieșiri" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                  Top produse după cantitate în stoc
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantity" fill="#8884d8" name="Cantitate" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Rapoarte disponibile</CardTitle>
                  <CardDescription>
                    Selectați un raport pentru a-l genera
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportsList.map(report => (
                      <div 
                        key={report.id} 
                        className={`p-3 rounded-md border cursor-pointer hover:bg-muted transition-colors ${selectedReport === report.id ? 'bg-muted border-primary' : ''}`}
                        onClick={() => setSelectedReport(report.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`mt-0.5 ${selectedReport === report.id ? 'text-primary' : 'text-muted-foreground'}`}>
                            <report.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">{report.name}</h4>
                            <p className="text-xs text-muted-foreground">{report.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedReport 
                      ? reportsList.find(r => r.id === selectedReport)?.name || "Generare raport" 
                      : "Generare raport"}
                  </CardTitle>
                  <CardDescription>
                    {selectedReport 
                      ? "Configurați și generați raportul selectat" 
                      : "Selectați un raport din lista de rapoarte disponibile"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedReport ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Interval de timp</h3>
                        <div className="flex items-center space-x-4">
                          <div className="grid gap-2">
                            <Label htmlFor="from">De la</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id="from"
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange.from ? (
                                    format(dateRange.from, "PPP")
                                  ) : (
                                    <span>Selectați data de început</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={dateRange.from}
                                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="to">Până la</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id="to"
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange.to ? (
                                    format(dateRange.to, "PPP")
                                  ) : (
                                    <span>Selectați data de sfârșit</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={dateRange.to}
                                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Filtre raport</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="warehouse">Gestiune</Label>
                            <Select defaultValue="all">
                              <SelectTrigger id="warehouse">
                                <SelectValue placeholder="Toate gestiunile" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Toate gestiunile</SelectItem>
                                <SelectItem value="1">Depozit Central</SelectItem>
                                <SelectItem value="2">Magazin București</SelectItem>
                                <SelectItem value="3">Magazin Cluj</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Categorie Produse</Label>
                            <Select defaultValue="all">
                              <SelectTrigger id="category">
                                <SelectValue placeholder="Toate categoriile" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Toate categoriile</SelectItem>
                                <SelectItem value="1">Electronice</SelectItem>
                                <SelectItem value="2">Mobilier</SelectItem>
                                <SelectItem value="3">Accesorii</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Opțiuni raport</h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="include-details" />
                            <Label htmlFor="include-details">Include detalii complete</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="show-chart" defaultChecked />
                            <Label htmlFor="show-chart">Include grafice</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="group-by-category" />
                            <Label htmlFor="group-by-category">Grupare pe categorii</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">
                          <FileDown className="mr-2 h-4 w-4" />
                          Export Excel
                        </Button>
                        <Button variant="outline">
                          <Printer className="mr-2 h-4 w-4" />
                          Tipărire
                        </Button>
                        <Button onClick={generateReport} disabled={isGenerating}>
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generare...
                            </>
                          ) : (
                            <>
                              <FileBarChart className="mr-2 h-4 w-4" />
                              Generare Raport
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center">
                      <FileBarChart className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium">Niciun raport selectat</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                        Selectați un raport din lista din stânga pentru a configura și genera raportul dorit
                      </p>
                      <Button variant="outline" asChild>
                        <Link href="#" onClick={(e) => {
                          e.preventDefault();
                          setSelectedReport('stock-value');
                        }}>
                          Vezi rapoarte disponibile
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Inventory Assessment (Inventariere) Tab */}
        <TabsContent value="assessment" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Procesul de inventariere</h3>
            <Button size="sm" variant="default" asChild>
              <Link href="/inventory/assessments/new">
                <FilePlus className="mr-2 h-4 w-4" />
                Creează inventariere nouă
              </Link>
            </Button>
          </div>
          
          <Separator />
          
          <div className="rounded-md border">
            <div className="p-4">
              <h4 className="text-sm font-medium mb-2">Inventarieri recente</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Procesul de inventariere conform OMFP 2861/2009 și Legii contabilității 82/1991
              </p>
              
              {isLoadingAssessments ? (
                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center justify-center h-24">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                      <p className="text-sm text-muted-foreground">Se încarcă datele...</p>
                    </div>
                  </div>
                </div>
              ) : rawAssessmentData?.assessments?.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Număr</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tip</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Gestiune</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Operațiuni</th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                      {rawAssessmentData.assessments.slice(0, 5).map((assessment: any) => (
                        <tr key={assessment.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{assessment.assessment_number}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm capitalize">{assessment.assessment_type}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{assessment.warehouse_name || assessment.warehouse_id}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{new Date(assessment.start_date).toLocaleDateString('ro-RO')}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              assessment.status === 'finalized' || assessment.status === 'approved' ? 
                                'bg-green-100 text-green-800' : 
                              assessment.status === 'draft' ? 
                                'bg-gray-100 text-gray-800' : 
                                'bg-orange-100 text-orange-800'
                            }`}>
                              {assessment.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            {(assessment.status === 'draft' || assessment.status === 'in_progress') && (
                              <Link to={`/inventory/assessments/edit/${assessment.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Editează</span>
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-2 border-t flex justify-between items-center bg-muted/50">
                    <span className="text-xs text-muted-foreground pl-3">
                      Ultimele {Math.min(5, rawAssessmentData.assessments.length)} din {rawAssessmentData.assessments.length} inventarieri
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleLoadAssessmentData}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Reîmprospătează
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center justify-center h-24">
                    <div className="text-center">
                      <FileCheck className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nu există date de inventariere
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2" 
                        onClick={handleLoadAssessmentData}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Încarcă date
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <h4 className="text-sm font-medium">Evaluarea stocurilor (Metode contabile)</h4>
            <p className="text-xs text-muted-foreground mb-2">
              Alege metoda de evaluare a stocurilor conform standardelor românești de contabilitate
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">FIFO</CardTitle>
                  <CardDescription>
                    First In, First Out (primul intrat, primul ieșit)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Bunurile ieșite din gestiune se evaluează la costul de achiziție al primei intrări.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline" className="w-full">
                    Calcul FIFO
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">LIFO</CardTitle>
                  <CardDescription>
                    Last In, First Out (ultimul intrat, primul ieșit)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Bunurile ieșite din gestiune se evaluează la costul de achiziție al ultimei intrări.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline" className="w-full">
                    Calcul LIFO
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">CMP</CardTitle>
                  <CardDescription>
                    Costul Mediu Ponderat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Bunurile ieșite din gestiune se evaluează la un cost mediu ponderat calculat după fiecare intrare.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline" className="w-full">
                    Calcul CMP
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Documente de inventariere</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <FileCheck className="h-4 w-4 mr-2 text-primary" />
                  Lista de inventariere
                </li>
                <li className="flex items-center">
                  <FileCheck className="h-4 w-4 mr-2 text-primary" />
                  Decizie de numire a comisiei de inventariere
                </li>
                <li className="flex items-center">
                  <FileCheck className="h-4 w-4 mr-2 text-primary" />
                  Declarație gestionarului
                </li>
                <li className="flex items-center">
                  <FileCheck className="h-4 w-4 mr-2 text-primary" />
                  Proces verbal de inventariere
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryReportsPage;