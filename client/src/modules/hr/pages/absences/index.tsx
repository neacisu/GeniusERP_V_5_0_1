import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Calendar, 
  Plus, 
  Search, 
  RefreshCw,
  Download,
  Trash,
  FileText,
  User,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import HrLayout from '../../components/layout/HrLayout';
import { useHrApi } from '../../hooks/useHrApi';
import StatsCard from '../../components/cards/StatsCard';
import { formatDate } from '../../utils/helpers';

/**
 * Absences Page Component
 */
const AbsencesPage: React.FC = () => {
  const [_, navigate] = useLocation();
  
  // State for current page, sort, and filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterEmployeeId, setFilterEmployeeId] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>('pending');
  const [activeTab, setActiveTab] = useState('all');
  
  // State for confirm deletion
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState<string>('');
  
  // Use HR API hooks
  const { 
    useAbsences, 
    useEmployees,
    useDeleteAbsence
  } = useHrApi();
  
  // Fetch absences with pagination, sorting and filtering
  const { 
    data: absencesResponse, 
    isLoading: isLoadingAbsences,
    refetch: refetchAbsences 
  } = useAbsences(
    currentPage,
    itemsPerPage,
    searchTerm,
    filterType,
    filterEmployeeId,
    filterStatus
  );
  
  // Fetch employees for filter
  const { data: employeesResponse } = useEmployees(1, 100, '', undefined, true);
  
  // Mutation for delete absence
  const { mutate: deleteAbsence } = useDeleteAbsence();
  
  // Extract data from responses
  const absences = absencesResponse?.data?.items || [];
  const totalAbsences = absencesResponse?.data?.total || 0;
  const employees = employeesResponse?.data?.items || [];
  
  // Stats calculations
  const pendingAbsences = absences.filter(a => a.status === 'pending').length;
  const approvedAbsences = absences.filter(a => a.status === 'approved').length;
  const rejectedAbsences = absences.filter(a => a.status === 'rejected').length;
  
  // Absence types for filter
  const absenceTypes = [
    { value: 'vacation', label: 'Concediu de odihnă' },
    { value: 'sick_leave', label: 'Concediu medical' },
    { value: 'unpaid_leave', label: 'Concediu fără plată' },
    { value: 'parental_leave', label: 'Concediu parental' },
    { value: 'study_leave', label: 'Concediu pentru studii' },
    { value: 'other', label: 'Alt tip de absență' }
  ];
  
  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  // Handle new absence
  const handleNewAbsence = () => {
    navigate('/hr/absences/new');
  };
  
  // Handle view absence
  const handleViewAbsence = (id: string) => {
    navigate(`/hr/absences/${id}`);
  };
  
  // Handle delete absence
  const handleDeleteAbsence = (id: string) => {
    setAbsenceToDelete(id);
    setShowConfirmDelete(true);
  };
  
  // Confirm delete absence
  const confirmDeleteAbsence = () => {
    if (absenceToDelete) {
      deleteAbsence(absenceToDelete, {
        onSuccess: () => {
          refetchAbsences();
          setShowConfirmDelete(false);
        }
      });
    }
  };
  
  // Get employee name
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.lastName} ${employee.firstName}` : 'Necunoscut';
  };
  
  // Get absence type label
  const getAbsenceTypeLabel = (type: string) => {
    const absenceType = absenceTypes.find(t => t.value === type);
    return absenceType ? absenceType.label : type;
  };
  
  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">În așteptare</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Aprobat</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">Respins</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <HrLayout 
      activeTab="absences" 
      title="Absențe" 
      subtitle="Gestionarea absențelor și concediilor"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total absențe"
            value={totalAbsences.toString()}
            icon={<Calendar size={20} />}
            color="primary"
          />
          
          <StatsCard
            title="În așteptare"
            value={pendingAbsences.toString()}
            icon={<Clock size={20} />}
            color="warning"
          />
          
          <StatsCard
            title="Aprobate"
            value={approvedAbsences.toString()}
            icon={<CheckCircle size={20} />}
            color="success"
          />
          
          <StatsCard
            title="Respinse"
            value={rejectedAbsences.toString()}
            icon={<XCircle size={20} />}
            color="danger"
          />
        </div>
        
        {/* Absences Table Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <CardTitle>Absențe și concedii</CardTitle>
                <CardDescription>
                  Gestionați absențele și concediile angajaților
                </CardDescription>
              </div>
              
              <Button onClick={handleNewAbsence}>
                <Plus className="mr-2 h-4 w-4" />
                Adaugă absență
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tabs for absence status */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" onClick={() => setFilterStatus(undefined)}>
                  Toate
                </TabsTrigger>
                <TabsTrigger value="pending" onClick={() => setFilterStatus('pending')}>
                  În așteptare
                </TabsTrigger>
                <TabsTrigger value="approved" onClick={() => setFilterStatus('approved')}>
                  Aprobate
                </TabsTrigger>
                <TabsTrigger value="rejected" onClick={() => setFilterStatus('rejected')}>
                  Respinse
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Caută absență..." 
                  className="pl-8 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select 
                value={filterType || 'all'} 
                onValueChange={(value) => setFilterType(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Tip absență" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate tipurile</SelectItem>
                  {absenceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={filterEmployeeId || 'all'} 
                onValueChange={(value) => setFilterEmployeeId(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Angajat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți angajații</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.lastName} {emp.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={() => refetchAbsences()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Absences Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Angajat</TableHead>
                  <TableHead>Tip absență</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('startDate')}>
                    <div className="flex items-center gap-1">
                      Perioada
                      {sortBy === 'startDate' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Durata</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAbsences ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Se încarcă absențele...</TableCell>
                  </TableRow>
                ) : absences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Nu au fost găsite absențe</TableCell>
                  </TableRow>
                ) : (
                  absences.map((absence) => (
                    <TableRow key={absence.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewAbsence(absence.id)}>
                      <TableCell className="font-medium">
                        {getEmployeeName(absence.employeeId)}
                      </TableCell>
                      <TableCell>
                        {getAbsenceTypeLabel(absence.type)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs">
                            De la: {formatDate(absence.startDate)}
                          </span>
                          <span className="text-xs">
                            Până la: {formatDate(absence.endDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {absence.daysCount} zile
                      </TableCell>
                      <TableCell>{getStatusBadge(absence.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewAbsence(absence.id);
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Detalii absență
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAbsence(absence.id);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Șterge absență
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Afișare <strong>{absences.length}</strong> din <strong>{totalAbsences}</strong> absențe
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={absences.length < itemsPerPage}
                >
                  Următor
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HrLayout>
  );
};

export default AbsencesPage;