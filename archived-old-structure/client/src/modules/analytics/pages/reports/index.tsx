/**
 * Analytics Reports Page
 * 
 * Pagină pentru afișarea și gestionarea rapoartelor analitice
 * cu opțiuni de filtrare, sortare și export.
 */

import React, { useState } from 'react';
import { useAnalyticsReports, type AnalyticsReport } from '../../hooks/useAnalyticsReports';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Search, 
  PlusCircle, 
  MoreVertical, 
  Download, 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  Clock, 
  Users, 
  Filter, 
  BarChart4, 
  LineChart, 
  PieChart,
  LayoutGrid,
  Table as TableIcon,
  ArrowDownAZ,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { AnalyticsEmptyState } from '../../components/common/AnalyticsEmptyState';
import { AnalyticsLayout } from '../../components/common/AnalyticsLayout';

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  const { 
    reports, 
    total, 
    isLoading, 
    deleteReport, 
    runReport
  } = useAnalyticsReports({
    search: searchQuery,
    type: filterType !== 'all' ? filterType : undefined,
    page: currentPage,
    limit: itemsPerPage
  });
  
  const totalPages = Math.ceil(total / itemsPerPage);
  
  const goToPage = (page: number) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search este deja actualizat prin state
  };
  
  const handleRunReport = (id: string) => {
    runReport(id);
  };
  
  const handleDeleteReport = (id: string) => {
    deleteReport(id);
    setConfirmDeleteId(null);
  };
  
  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'financial':
        return <BarChart4 className="h-4 w-4 text-green-600" />;
      case 'sales':
        return <LineChart className="h-4 w-4 text-blue-600" />;
      case 'inventory':
        return <PieChart className="h-4 w-4 text-purple-600" />;
      case 'marketing':
        return <Users className="h-4 w-4 text-orange-600" />;
      case 'operations':
        return <TableIcon className="h-4 w-4 text-amber-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'financial':
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case 'sales':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case 'inventory':
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case 'marketing':
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case 'operations':
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  return (
    <AnalyticsLayout activeTab="reports">
      <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Rapoarte analitice</h1>
        <p className="text-muted-foreground">
          Gestionați rapoartele analitice ale companiei
        </p>
      </div>
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Căutare rapoarte..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Toate tipurile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tipurile</SelectItem>
                <SelectItem value="financial">Financiar</SelectItem>
                <SelectItem value="sales">Vânzări</SelectItem>
                <SelectItem value="inventory">Inventar</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="operations">Operațional</SelectItem>
                <SelectItem value="custom">Personalizat</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filtrare avansată</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="public" />
                    <label
                      htmlFor="public"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Doar rapoarte publice
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="created" />
                    <label
                      htmlFor="created"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Create de mine
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="scheduled" />
                    <label
                      htmlFor="scheduled"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Cu programare
                    </label>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button className="w-full" size="sm">Aplică filtre</Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" className="flex gap-1" asChild>
              <div>
                <ArrowDownAZ className="h-4 w-4" />
                <span className="sr-only md:not-sr-only md:inline-block">Sortare</span>
              </div>
            </Button>
            
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
                className={`h-9 w-9 rounded-none rounded-r-md ${viewMode === 'table' ? 'bg-muted' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="h-4 w-4" />
                <span className="sr-only">Table view</span>
              </Button>
            </div>
          </div>
          
          <Button asChild>
            <Link href="/analytics/reports/create">
              <PlusCircle className="h-4 w-4 mr-2" />
              Raport nou
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all">Toate rapoartele</TabsTrigger>
          <TabsTrigger value="favorites">Favorite</TabsTrigger>
          <TabsTrigger value="recent">Recente</TabsTrigger>
          <TabsTrigger value="scheduled">Programate</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <AnalyticsEmptyState
              title="Niciun raport găsit"
              description="Nu există rapoarte care să corespundă criteriilor de căutare sau nu a fost creat niciun raport încă."
              icon={<FileText className="h-full w-full" />}
              action={{
                label: "Creează raport nou",
                href: "/analytics/reports/create"
              }}
              variant="card"
            />
          ) : viewMode === 'table' ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Nume raport</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Creat de</TableHead>
                    <TableHead>Data creării</TableHead>
                    <TableHead>Programare</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report: AnalyticsReport) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <Link href={`/analytics/reports/${report.id}`} className="hover:underline flex items-center">
                          {getReportTypeIcon(report.type)}
                          <span className="ml-2">{report.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getReportTypeColor(report.type)}
                        >
                          {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>Admin</TableCell> {/* În implementarea reală, ar trebui să avem numele utilizatorului */}
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <span>{formatDate(report.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.schedule ? (
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            <span>{report.schedule}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Fără programare</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRunReport(report.id)}
                          >
                            <Play className="h-4 w-4" />
                            <span className="sr-only">Rulează</span>
                          </Button>
                          
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/analytics/reports/${report.id}`}>
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Vizualizare</span>
                            </Link>
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Acțiuni</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/analytics/reports/${report.id}/edit`} className="cursor-pointer">
                                  <Edit className="h-4 w-4 mr-2" />
                                  <span>Editează</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                <span>Duplică</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                <span>Exportă</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => setConfirmDeleteId(report.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span>Șterge</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Grid view
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report: AnalyticsReport) => (
                <Card key={report.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge 
                          variant="outline" 
                          className={getReportTypeColor(report.type)}
                        >
                          {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                        </Badge>
                        <CardTitle className="mt-2 text-lg">{report.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Acțiuni</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/analytics/reports/${report.id}/edit`} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              <span>Editează</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            <span>Duplică</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            <span>Exportă</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setConfirmDeleteId(report.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Șterge</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {report.description && (
                      <CardDescription className="line-clamp-2">
                        {report.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm space-y-2">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        <span>Creat la {formatDate(report.createdAt)}</span>
                      </div>
                      {report.schedule && (
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          <span>Programat {report.schedule}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex items-center gap-2 w-full">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleRunReport(report.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        <span>Rulează</span>
                      </Button>
                      <Button variant="default" size="sm" className="flex-1" asChild>
                        <Link href={`/analytics/reports/${report.id}`}>
                          <FileText className="h-4 w-4 mr-1" />
                          <span>Vizualizare</span>
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Afișare {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, total)} din {total} rezultate
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Calculate page numbers for pagination - simplified for brevity
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Următor
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites">
          <AnalyticsEmptyState
            title="Niciun raport favorit"
            description="Marcați rapoartele ca favorite pentru a le accesa rapid."
            icon={<FileText className="h-full w-full" />}
            variant="card"
          />
        </TabsContent>
        
        <TabsContent value="recent">
          <AnalyticsEmptyState
            title="Niciun raport recent"
            description="Rapoartele vizualizate recent vor apărea aici."
            icon={<Clock className="h-full w-full" />}
            variant="card"
          />
        </TabsContent>
        
        <TabsContent value="scheduled">
          <AnalyticsEmptyState
            title="Niciun raport programat"
            description="Programați rapoarte pentru a fi generate automat la intervale regulate."
            icon={<Calendar className="h-full w-full" />}
            variant="card"
          />
        </TabsContent>
      </Tabs>
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmare ștergere</DialogTitle>
            <DialogDescription>
              Sunteți sigur că doriți să ștergeți acest raport? Această acțiune nu poate fi anulată.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
            >
              Anulează
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && handleDeleteReport(confirmDeleteId)}
            >
              Șterge raportul
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AnalyticsLayout>
  );
}