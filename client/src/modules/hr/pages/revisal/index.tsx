import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  FileText,
  Upload,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  FileWarning,
  Search,
  Filter,
  PlusCircle,
  RefreshCw,
  Briefcase,
  BookOpen,
  ArrowRight,
  Info,
  Calendar,
  Loader2
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import HrLayout from '../../components/layout/HrLayout';
import { formatDate } from '../../utils/helpers';
import { useToast } from '@/hooks/use-toast';

/**
 * Revisal Page Component
 * 
 * Page for managing the Revisal registry for employees (Romania specific)
 */
const RevisalPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("operations");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const itemsPerPage = 10;
  
  // Get Revisal data with filtering and pagination
  const { 
    data: operationsResponse, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['/api/hr/revisal/operations', currentPage, itemsPerPage, searchTerm, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const res = await apiRequest('GET', `/api/hr/revisal/operations?${params.toString()}`);
      return await res.json();
    },
  });
  
  // Get Revisal statistics
  const { data: statsResponse } = useQuery({
    queryKey: ['/api/hr/revisal/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/hr/revisal/stats');
      return await res.json();
    },
  });
  const stats = statsResponse?.data || {
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    lastUpdate: '',
    nextUpdate: ''
  };
  
  // Process operations data
  const operations = operationsResponse?.data?.items || [];
  const total = operationsResponse?.data?.total || 0;
  
  // Calculate pagination
  const totalPages = Math.ceil(total / itemsPerPage);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest('POST', '/api/hr/revisal/upload', formData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Fișier încărcat cu succes',
        description: 'Fișierul a fost încărcat și va fi procesat în curând.',
      });
      setShowUploadDialog(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/hr/revisal/operations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hr/revisal/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut încărca fișierul. ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handle file upload
  const handleUpload = () => {
    setShowUploadDialog(true);
  };
  
  // Handle form submission for file upload
  const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    uploadMutation.mutate(formData);
  };
  
  // Handle download Revisal export
  const handleDownload = async () => {
    try {
      toast({
        title: 'Descărcare inițiată',
        description: 'Fișierul Revisal va fi descărcat în curând.',
      });
      
      // In a real implementation, this would make a request to download the file
      // The backend would return the file as a blob, which would then be downloaded
      // window.location.href = '/api/hr/revisal/download';
      
      // For now, we'll just show a toast
      setTimeout(() => {
        toast({
          title: 'Notă',
          description: 'În implementarea reală, acesta ar descărca un fișier Revisal.',
        });
      }, 1500);
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut descărca fișierul Revisal.',
        variant: 'destructive',
      });
    }
  };
  
  // Helper to get badge color by status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case 'completed':
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case 'processing':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case 'failed':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  // Helper to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  // Helper to get operation description
  const getOperationDescription = (type: string) => {
    switch (type) {
      case 'hire':
        return 'Angajare nouă';
      case 'terminate':
        return 'Încetare contract';
      case 'modify':
        return 'Modificare contract';
      case 'suspend':
        return 'Suspendare contract';
      case 'resume':
        return 'Reluare activitate';
      case 'transfer':
        return 'Transfer';
      default:
        return 'Operație';
    }
  };

  return (
    <HrLayout 
      activeTab="revisal" 
      title="Registrul Revisal" 
      subtitle="Gestionarea registrului general de evidență a salariaților"
    >
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Încarcă fișier Revisal</DialogTitle>
            <DialogDescription>
              Încarcă un fișier Revisal (.rvs) pentru procesare. Acesta va fi validat și procesat.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUploadSubmit} className="space-y-6 pt-2">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="revisalFile" className="text-sm font-medium">
                Fișier Revisal
              </label>
              <Input 
                id="revisalFile"
                name="revisalFile"
                type="file"
                accept=".rvs,.RVS,.xml,.XML"
                required
              />
              <p className="text-xs text-muted-foreground">
                Formatele acceptate: .rvs, .xml
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descriere (opțional)
              </label>
              <Textarea 
                id="description"
                name="description"
                placeholder="Descriere pentru această operație..."
                className="resize-none"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowUploadDialog(false)}
              >
                Anulează
              </Button>
              <Button 
                type="submit"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se încarcă...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Încarcă
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Operations Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total operații</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-muted-foreground">
                  Toate operațiile din registrul Revisal
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Pending Operations Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">În așteptare</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.pending}</h3>
                </div>
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-muted-foreground">
                  Operații în așteptare care necesită procesare
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Completed Operations Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Operații finalizate</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.completed}</h3>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-muted-foreground">
                  Operații procesate cu succes
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Next Update Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Următoarea actualizare</p>
                  <h3 className="text-lg font-bold mt-1">{stats.nextUpdate || 'Neplanificată'}</h3>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-muted-foreground">
                  Ultima actualizare: {stats.lastUpdate || 'Niciodată'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acțiuni rapide</CardTitle>
            <CardDescription>
              Acțiuni pentru gestionarea registrului Revisal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/40">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Upload className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-medium mb-1">Încarcă registru</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Încarcă un fișier Revisal pentru procesare
                  </p>
                  <Button onClick={handleUpload} size="sm" className="w-full">
                    Încarcă fișier
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/40">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Download className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-medium mb-1">Descarcă registru</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Descarcă registrul Revisal în format .rvs
                  </p>
                  <Button onClick={handleDownload} size="sm" variant="outline" className="w-full">
                    Descarcă fișier
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/40">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <BookOpen className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-medium mb-1">Validare registru</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Verifică și validează registrul în format electronic
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Validează registru
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        {/* Revisal Operations */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <CardTitle>Operații Revisal</CardTitle>
                <CardDescription>
                  Istoricul operațiilor efectuate în registrul Revisal
                </CardDescription>
              </div>
              
              <Button onClick={() => navigate('/hr/revisal/new')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Operație nouă
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <Tabs defaultValue="operations" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="operations">
                  <FileText className="h-4 w-4 mr-2" />
                  Operații
                </TabsTrigger>
                <TabsTrigger value="employees">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Salariați
                </TabsTrigger>
                <TabsTrigger value="logs">
                  <FileWarning className="h-4 w-4 mr-2" />
                  Loguri și erori
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="operations" className="mt-0 p-0">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Caută după angajat sau CNP..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="w-full md:w-auto min-w-[200px]">
                  <Select 
                    value={filterStatus} 
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toate statusurile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate statusurile</SelectItem>
                      <SelectItem value="pending">În așteptare</SelectItem>
                      <SelectItem value="processing">În procesare</SelectItem>
                      <SelectItem value="completed">Finalizate</SelectItem>
                      <SelectItem value="failed">Eșuate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" className="flex gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtre</span>
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-muted-foreground">Se încarcă datele...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-8 text-destructive">
                  <p>A apărut o eroare la încărcarea datelor.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="mt-4"
                  >
                    Reîncarcă
                  </Button>
                </div>
              ) : operations.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-medium mb-2">Nu există operații</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Nu au fost găsite operații Revisal pentru criteriile selectate.
                  </p>
                  <Button onClick={() => navigate('/hr/revisal/new')}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adaugă operație nouă
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tip operație</TableHead>
                        <TableHead>Angajat</TableHead>
                        <TableHead>CNP</TableHead>
                        <TableHead>Data operației</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations.map((operation) => (
                        <TableRow key={operation.id}>
                          <TableCell>
                            {getOperationDescription(operation.type)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{operation.employeeName}</div>
                          </TableCell>
                          <TableCell>{operation.employeeCnp}</TableCell>
                          <TableCell>{formatDate(operation.date)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={`flex items-center gap-1 w-fit ${getStatusBadgeClass(operation.status)}`}
                            >
                              {getStatusIcon(operation.status)}
                              <span>
                                {operation.status === 'pending' && 'În așteptare'}
                                {operation.status === 'processing' && 'În procesare'}
                                {operation.status === 'completed' && 'Finalizat'}
                                {operation.status === 'failed' && 'Eșuat'}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/hr/revisal/${operation.id}`)}
                            >
                              Detalii
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Afișare <strong>{operations.length}</strong> din <strong>{total}</strong> operații
                    </div>
                    
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNumber = i + 1;
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink 
                                onClick={() => handlePageChange(pageNumber)}
                                isActive={currentPage === pageNumber}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        {totalPages > 5 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="employees" className="mt-0 p-0">
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-medium mb-2">Informații salariați</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Această secțiune va afișa un raport cu toți salariații înregistrați în Revisal.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="logs" className="mt-0 p-0">
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <FileWarning className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-medium mb-2">Loguri și erori</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Această secțiune va afișa logurile și erorile întâmpinate la procesarea operațiilor Revisal.
                  </p>
                </div>
              </div>
            </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Revisal Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Ghid Revisal</CardTitle>
            <CardDescription>
              Informații despre utilizarea registrului Revisal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* HG 905/2017 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">HG 905/2017</CardTitle>
                  <CardDescription>
                    Hotărârea Guvernului privind registrul general de evidență a salariaților
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Registrul general de evidență a salariaților este reglementat prin HG 905/2017.
                    Află mai multe despre obligațiile legale.
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    Vezi legislația
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Termene legale */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Termene legale</CardTitle>
                  <CardDescription>
                    Termene pentru transmiterea datelor în Revisal
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Orice modificare a datelor de identificare ale angajatorului sau ale salariatului 
                    trebuie transmisă în Revisal în termen de 3 zile lucrătoare.
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    Vezi toate termenele
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Proceduri */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Proceduri de lucru</CardTitle>
                  <CardDescription>
                    Proceduri pentru gestionarea corectă a registrului
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Consultă procedurile de lucru pentru gestionarea eficientă a registrului Revisal
                    și evitarea erorilor frecvente.
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    Vezi procedurile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Încarcă fișier Revisal</DialogTitle>
            <DialogDescription>
              Încarcă un fișier Revisal în format .rvs pentru procesare
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Trage fișierul aici</h3>
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Sau fă click pentru a selecta fișierul (format .rvs)
              </p>
              <Button variant="outline" size="sm">
                Selectează fișier
              </Button>
            </div>
            
            <div className="text-sm mt-2">
              <p className="font-medium">Validarea fișierului:</p>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Verificare format</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800">Validat</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Verificare angajați</span>
                  <Progress value={33} className="h-2 w-20" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Verificare contracte</span>
                  <span className="text-sm text-muted-foreground">În așteptare</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Anulează
            </Button>
            <Button type="submit">Încarcă și procesează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HrLayout>
  );
};

export default RevisalPage;