import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  FileText, 
  Plus, 
  Search, 
  RefreshCw,
  Download,
  Trash,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
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
import HrLayout from '../../components/layout/HrLayout';
import { useHrApi } from '../../hooks/useHrApi';
import StatsCard from '../../components/cards/StatsCard';
import { formatDate, formatCurrency } from '../../utils/helpers';

/**
 * Contracts Page Component
 */
const ContractsPage: React.FC = () => {
  const [_, navigate] = useLocation();
  
  // State for current page, sort, and filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>('active');
  const [filterEmployeeId, setFilterEmployeeId] = useState<string | undefined>();
  
  // State for confirm deletion
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string>('');
  
  // Use HR API hooks
  const { 
    useContracts, 
    useEmployees,
    deleteContract
  } = useHrApi();
  
  // Fetch contracts with pagination, sorting and filtering
  const { 
    data: contractsResponse, 
    isLoading: isLoadingContracts,
    refetch: refetchContracts 
  } = useContracts(
    currentPage,
    itemsPerPage,
    searchTerm,
    filterStatus,
    filterEmployeeId
  );
  
  // Fetch employees for filter
  const { data: employeesResponse } = useEmployees(1, 100, '', undefined, true);
  
  // Extract data from responses
  const contracts = contractsResponse?.data?.items || [];
  const totalContracts = contractsResponse?.data?.total || 0;
  const employees = employeesResponse?.data?.items || [];
  
  // Stats calculations
  const activeContracts = contracts.filter((c: any) => c.status === 'active').length;
  const expiringSoonContracts = contracts.filter((c: any) => c.status === 'expiring_soon').length;
  const expiredContracts = contracts.filter((c: any) => c.status === 'expired').length;
  
  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  // Handle new contract
  const handleNewContract = () => {
    navigate('/hr/contracts/new');
  };
  
  // Handle view contract
  const handleViewContract = (id: string) => {
    navigate(`/hr/contracts/${id}`);
  };
  
  // Handle delete contract
  const handleDeleteContract = (id: string) => {
    setContractToDelete(id);
    setShowConfirmDelete(true);
  };
  
  // Confirm delete contract
  const confirmDeleteContract = async () => {
    if (contractToDelete) {
      try {
        await deleteContract(contractToDelete);
        refetchContracts();
        setShowConfirmDelete(false);
      } catch (error) {
        console.error('Error deleting contract:', error);
      }
    }
  };
  
  // Get employee name
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp: any) => emp.id === employeeId);
    return employee ? `${employee.lastName} ${employee.firstName}` : 'Necunoscut';
  };
  
  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Activ</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">Expirat</Badge>;
      case 'expiring_soon':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">Expiră curând</Badge>;
      case 'terminated':
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 hover:bg-slate-50">Terminat</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <HrLayout 
      activeTab="contracts" 
      title="Contracte" 
      subtitle="Gestionare contracte de muncă"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total contracte"
            value={totalContracts.toString()}
            icon={<FileText size={20} />}
            color="primary"
          />
          
          <StatsCard
            title="Contracte active"
            value={activeContracts.toString()}
            icon={<CheckCircle size={20} />}
            color="success"
          />
          
          <StatsCard
            title="Expiră curând"
            value={expiringSoonContracts.toString()}
            icon={<AlertTriangle size={20} />}
            color="warning"
          />
          
          <StatsCard
            title="Expirate"
            value={expiredContracts.toString()}
            icon={<XCircle size={20} />}
            color="danger"
          />
        </div>
        
        {/* Contracts Table Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <CardTitle>Lista contractelor</CardTitle>
                <CardDescription>
                  Gestionați contractele de muncă
                </CardDescription>
              </div>
              
              <Button onClick={handleNewContract}>
                <Plus className="mr-2 h-4 w-4" />
                Contract nou
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Caută contract..." 
                  className="pl-8 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select 
                value={filterStatus || 'all'} 
                onValueChange={(value) => setFilterStatus(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate contractele</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring_soon">Expiră curând</SelectItem>
                  <SelectItem value="expired">Expirate</SelectItem>
                  <SelectItem value="terminated">Terminate</SelectItem>
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
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.lastName} {emp.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={() => refetchContracts()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Contracts Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Angajat</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('contractNumber')}>
                    <div className="flex items-center gap-1">
                      Nr. contract
                      {sortBy === 'contractNumber' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('startDate')}>
                    <div className="flex items-center gap-1">
                      Perioada
                      {sortBy === 'startDate' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Tip contract</TableHead>
                  <TableHead>Salariu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingContracts ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Se încarcă contractele...</TableCell>
                  </TableRow>
                ) : contracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Nu au fost găsite contracte</TableCell>
                  </TableRow>
                ) : (
                  contracts.map((contract: any) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(contract.employeeId)}
                      </TableCell>
                      <TableCell>
                        {contract.contractNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs">
                            De la: {formatDate(contract.startDate)}
                          </span>
                          <span className="text-xs">
                            Până la: {contract.endDate ? formatDate(contract.endDate) : 'Nedeterminată'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.contractType === 'full_time' ? 'Normă întreagă' : 
                         contract.contractType === 'part_time' ? 'Part-time' : contract.contractType}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(contract.grossSalary)} RON
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewContract(contract.id)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Detalii contract
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteContract(contract.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Șterge contract
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
                Afișare <strong>{contracts.length}</strong> din <strong>{totalContracts}</strong> contracte
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
                  disabled={contracts.length < itemsPerPage}
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

export default ContractsPage;