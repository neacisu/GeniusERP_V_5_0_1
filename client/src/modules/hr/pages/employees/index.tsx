import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw,
  MoreVertical,
  Download,
  FileText,
  Trash,
  Mail,
  Phone,
  Building2,
  CalendarDays,
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
  DropdownMenuGroup,
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
import { formatCNP } from '../../utils/helpers';

/**
 * Employees Page Component
 * 
 * Main page for employee management
 */
const EmployeesPage: React.FC = () => {
  const [_, navigate] = useLocation();
  
  // State for current page, sort, and filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>('active');
  
  // State for confirm deletion
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string>('');
  
  // Use HR API hooks
  const { 
    useEmployees, 
    useDepartments,
    useDeleteEmployee
  } = useHrApi();
  
  // Fetch employees with pagination, sorting and filtering
  const { 
    data: employeesResponse, 
    isLoading: isLoadingEmployees,
    refetch: refetchEmployees 
  } = useEmployees(
    currentPage,
    itemsPerPage,
    searchTerm,
    filterDepartmentId,
    false
  );
  
  // Fetch departments for filter
  const { data: departmentsResponse } = useDepartments();
  
  // Mutation for delete employee
  const { mutate: deleteEmployee } = useDeleteEmployee();
  
  // Extract data from responses
  const employees = employeesResponse?.data?.items || [];
  const totalEmployees = employeesResponse?.data?.total || 0;
  const departments = departmentsResponse?.data || [];
  
  // Stats calculations
  const activeEmployees = employees.filter((emp: any) => emp.status === 'active').length;
  const inactiveEmployees = employees.filter((emp: any) => emp.status === 'inactive').length;
  const onLeaveEmployees = employees.filter((emp: any) => emp.status === 'on_leave').length;
  
  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  // Handle new employee
  const handleNewEmployee = () => {
    navigate('/hr/employees/new');
  };
  
  // Handle view employee
  const handleViewEmployee = (id: string) => {
    navigate(`/hr/employees/${id}`);
  };
  
  // Handle edit employee
  const handleEditEmployee = (id: string) => {
    navigate(`/hr/employees/${id}/edit`);
  };
  
  // Handle delete employee
  const handleDeleteEmployee = (id: string) => {
    setEmployeeToDelete(id);
    setShowConfirmDelete(true);
  };
  
  // Confirm delete employee
  const confirmDeleteEmployee = () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete, {
        onSuccess: () => {
          refetchEmployees();
          setShowConfirmDelete(false);
        }
      });
    }
  };
  
  // Get department name
  const getDepartmentName = (departmentId: string) => {
    const department = departments.find((dept: any) => dept.id === departmentId);
    return department ? department.name : 'Nedefinit';
  };
  
  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Activ</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">Inactiv</Badge>;
      case 'on_leave':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">În concediu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <HrLayout 
      activeTab="employees" 
      title="Angajați" 
      subtitle="Gestionarea datelor despre angajați"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total angajați"
            value={totalEmployees.toString()}
            icon={<Users size={20} />}
            color="primary"
          />
          
          <StatsCard
            title="Activi"
            value={activeEmployees.toString()}
            icon={<CheckCircle size={20} />}
            color="success"
          />
          
          <StatsCard
            title="Inactivi"
            value={inactiveEmployees.toString()}
            icon={<XCircle size={20} />}
            color="danger"
          />
          
          <StatsCard
            title="În concediu"
            value={onLeaveEmployees.toString()}
            icon={<CalendarDays size={20} />}
            color="warning"
          />
        </div>
        
        {/* Employees Table Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <CardTitle>Lista angajaților</CardTitle>
                <CardDescription>
                  Gestionați informațiile despre angajați
                </CardDescription>
              </div>
              
              <Button onClick={handleNewEmployee}>
                <Plus className="mr-2 h-4 w-4" />
                Angajat nou
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Caută..." 
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
                  <SelectItem value="all">Toți angajații</SelectItem>
                  <SelectItem value="active">Activi</SelectItem>
                  <SelectItem value="inactive">Inactivi</SelectItem>
                  <SelectItem value="on_leave">În concediu</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filterDepartmentId || 'all'} 
                onValueChange={(value) => setFilterDepartmentId(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Departament" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate departamentele</SelectItem>
                  {departments.map((department: any) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={() => refetchEmployees()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Employees Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('lastName')}>
                    <div className="flex items-center gap-1">
                      Nume și prenume
                      {sortBy === 'lastName' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>CNP</TableHead>
                  <TableHead>Departament</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEmployees ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Se încarcă angajații...</TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Nu au fost găsiți angajați</TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee: any) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.lastName} {employee.firstName}
                      </TableCell>
                      <TableCell>{formatCNP(employee.cnp)}</TableCell>
                      <TableCell>{getDepartmentName(employee.departmentId)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Mail className="mr-1 h-3 w-3" />
                            {employee.email}
                          </span>
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Phone className="mr-1 h-3 w-3" />
                            {employee.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewEmployee(employee.id)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Detalii
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditEmployee(employee.id)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Editare
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteEmployee(employee.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Ștergere
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
                Afișare <strong>{employees.length}</strong> din <strong>{totalEmployees}</strong> angajați
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
                  disabled={employees.length < itemsPerPage}
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

export default EmployeesPage;