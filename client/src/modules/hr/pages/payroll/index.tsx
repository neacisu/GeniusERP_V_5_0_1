import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Wallet, 
  Plus, 
  Search, 
  RefreshCw,
  Download,
  Mail,
  FileText,
  Calculator,
  Clock,
  CalendarDays,
  ChevronDown,
  Users,
  ArrowUpDown
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
import { Progress } from "@/components/ui/progress";
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import HrLayout from '../../components/layout/HrLayout';
import { useHrApi } from '../../hooks/useHrApi';
import StatsCard from '../../components/cards/StatsCard';
import { formatCurrency, formatDate } from '../../utils/helpers';

/**
 * Payroll Page Component
 */
const PayrollPage: React.FC = () => {
  const [_, navigate] = useLocation();
  
  // Get current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // State for current page, sort, and filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState<string | undefined>();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  
  // Use HR API hooks for departments
  const { useDepartments } = useHrApi();
  
  // Fetch payroll records with pagination, sorting and filtering
  const { 
    data: payrollResponse, 
    isLoading: isLoadingPayroll,
    refetch: refetchPayroll 
  } = useQuery({
    queryKey: ['/api/hr/payroll', selectedYear, selectedMonth, currentPage, itemsPerPage, searchTerm, filterDepartmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      params.append('month', selectedMonth.toString());
      params.append('page', currentPage.toString());
      params.append('pageSize', itemsPerPage.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (filterDepartmentId) params.append('departmentId', filterDepartmentId);
      
      const response = await apiRequest(`/api/hr/payroll?${params.toString()}`);
      return response;
    }
  });
  
  // Fetch employees for filter directly with useQuery
  const { 
    data: employeesResponse 
  } = useQuery({
    queryKey: ['/api/hr/employees', 1, 100, '', true],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('pageSize', '100');
      params.append('activeOnly', 'true');
      
      const response = await apiRequest(`/api/hr/employees?${params.toString()}`);
      return response;
    }
  });
  
  // Fetch departments for filter
  const { data: departmentsResponse } = useDepartments();
  
  // Mutation for running payroll
  const { mutate: runPayroll } = useMutation({
    mutationFn: async (data: {year: number, month: number}) => {
      return await apiRequest('POST', '/api/hr/payroll/run', data);
    },
    onSuccess: () => {
      refetchPayroll();
    }
  });
  
  // Extract data from responses
  const payrollRecords = payrollResponse?.data?.items || [];
  const totalPayrollRecords = payrollResponse?.data?.total || 0;
  const employees = employeesResponse?.data?.items || [];
  const departments = departmentsResponse?.data || [];
  
  // Get month name
  const getMonthName = (month: number) => {
    const monthNames = [
      'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
    ];
    return monthNames[month - 1];
  };
  
  // Stats calculations
  const totalGrossSalary = payrollRecords.reduce((sum: number, record: any) => sum + record.grossSalary, 0);
  const totalNetSalary = payrollRecords.reduce((sum: number, record: any) => sum + record.netSalary, 0);
  const totalTaxes = payrollRecords.reduce((sum: number, record: any) => sum + record.totalTaxes, 0);
  
  // Get department name
  const getDepartmentName = (departmentId: string) => {
    const department = departments.find((dept: any) => dept.id === departmentId);
    return department ? department.name : 'Nedefinit';
  };
  
  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  // Handle run payroll
  const handleRunPayroll = () => {
    runPayroll(
      { year: selectedYear, month: selectedMonth },
      {
        onSuccess: () => {
          refetchPayroll();
        }
      }
    );
  };
  
  // Handle view payroll details
  const handleViewPayrollDetails = (id: string) => {
    navigate(`/hr/payroll/${id}`);
  };
  
  // Generate years array (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  
  // Generate months array
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  return (
    <HrLayout 
      activeTab="payroll" 
      title="Salarizare" 
      subtitle="Gestionarea și calculul salariilor"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Salarii brute"
            value={formatCurrency(totalGrossSalary)}
            icon={<Wallet size={20} />}
            color="primary"
          />
          
          <StatsCard
            title="Salarii nete"
            value={formatCurrency(totalNetSalary)}
            icon={<Wallet size={20} />}
            color="success"
          />
          
          <StatsCard
            title="Taxe și contribuții"
            value={formatCurrency(totalTaxes)}
            icon={<Calculator size={20} />}
            color="warning"
          />
          
          <StatsCard
            title="Angajați"
            value={totalPayrollRecords.toString()}
            icon={<Users size={20} />}
            color="secondary"
          />
        </div>
        
        {/* Period Selection Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <CardTitle>Salarizare {getMonthName(selectedMonth)} {selectedYear}</CardTitle>
                <CardDescription>
                  Gestionați salariile angajaților pentru perioada selectată
                </CardDescription>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-2 items-end">
                <div className="flex gap-2">
                  <Select 
                    value={selectedMonth.toString()} 
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Luna" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Anul" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleRunPayroll}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calcul salarizare
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Payroll Records Card */}
        <Card>
          <CardHeader>
            <CardTitle>State de plată</CardTitle>
            <CardDescription>
              Lista salariilor calculate pentru perioada {getMonthName(selectedMonth)} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Caută angajat..." 
                  className="pl-8 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select 
                value={filterDepartmentId || 'all'} 
                onValueChange={(value) => setFilterDepartmentId(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Departament" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate departamentele</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={() => refetchPayroll()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" className="ml-auto">
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Trimite fluturași
              </Button>
            </div>
            
            {/* Payroll Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('lastName')}>
                    <div className="flex items-center gap-1">
                      Nume angajat
                      {sortBy === 'lastName' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Departament</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('grossSalary')}>
                    <div className="flex items-center gap-1">
                      Salariu brut
                      {sortBy === 'grossSalary' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Taxe</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('netSalary')}>
                    <div className="flex items-center gap-1">
                      Salariu net
                      {sortBy === 'netSalary' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPayroll ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Se încarcă salariile...</TableCell>
                  </TableRow>
                ) : payrollRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nu există state de plată pentru perioada selectată. 
                      Folosiți butonul "Calcul salarizare" pentru a genera statele de plată.
                    </TableCell>
                  </TableRow>
                ) : (
                  payrollRecords.map((payroll: any) => (
                    <TableRow key={payroll.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewPayrollDetails(payroll.id)}>
                      <TableCell className="font-medium">
                        {payroll.lastName} {payroll.firstName}
                      </TableCell>
                      <TableCell>
                        {getDepartmentName(payroll.departmentId)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payroll.grossSalary)} RON
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payroll.totalTaxes)} RON
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payroll.netSalary)} RON
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPayrollDetails(payroll.id);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Afișare <strong>{payrollRecords.length}</strong> din <strong>{totalPayrollRecords}</strong> salarii
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
                  disabled={payrollRecords.length < itemsPerPage}
                >
                  Următor
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Payroll Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar salarizare</CardTitle>
            <CardDescription>
              Următoarele date importante pentru salarizare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Payroll Schedule Row */}
              <div className="flex items-center gap-3 p-3 border rounded-md">
                <div className="bg-blue-100 text-blue-800 rounded-lg p-3">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Plată salarii</div>
                  <div className="text-sm text-muted-foreground">Luna {getMonthName(selectedMonth)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{selectedYear}-{selectedMonth.toString().padStart(2, '0')}-10</div>
                  <div className="text-sm text-muted-foreground">Data plății</div>
                </div>
              </div>
              
              {/* Tax Declarations Row */}
              <div className="flex items-center gap-3 p-3 border rounded-md">
                <div className="bg-amber-100 text-amber-800 rounded-lg p-3">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Declarații fiscale</div>
                  <div className="text-sm text-muted-foreground">Declarația 112</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{selectedYear}-{selectedMonth.toString().padStart(2, '0')}-25</div>
                  <div className="text-sm text-muted-foreground">Termen limită</div>
                </div>
              </div>
              
              {/* Tax Payment Row */}
              <div className="flex items-center gap-3 p-3 border rounded-md">
                <div className="bg-green-100 text-green-800 rounded-lg p-3">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Plată contribuții</div>
                  <div className="text-sm text-muted-foreground">CAS, CASS, impozit</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{selectedYear}-{selectedMonth.toString().padStart(2, '0')}-25</div>
                  <div className="text-sm text-muted-foreground">Termen limită</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HrLayout>
  );
};

export default PayrollPage;