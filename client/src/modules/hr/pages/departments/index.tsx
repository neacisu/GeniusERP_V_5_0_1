import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Building, 
  Plus, 
  Search, 
  RefreshCw,
  Download,
  Trash,
  Users,
  FileText,
  ArrowUpDown,
  ChevronDown,
  Briefcase,
  ArrowRight
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
import { Separator } from "@/components/ui/separator";
import HrLayout from '../../components/layout/HrLayout';
import { useHrApi } from '../../hooks/useHrApi';
import StatsCard from '../../components/cards/StatsCard';

/**
 * Departments Page Component
 */
const DepartmentsPage: React.FC = () => {
  const [_, navigate] = useLocation();
  
  // State for current page, sort, and filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for confirm deletion
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string>('');
  
  // Use HR API hooks
  const { 
    useDepartments, 
    useEmployees,
    useDeleteDepartment 
  } = useHrApi();
  
  // Fetch departments with pagination, sorting and filtering
  const { 
    data: departmentsResponse, 
    isLoading: isLoadingDepartments,
    refetch: refetchDepartments 
  } = useDepartments();
  
  // Fetch employees
  const { data: employeesResponse } = useEmployees();
  
  // Function to delete department - utilizăm direct funcția în loc de hook
  const { mutate: deleteDepartment } = useDeleteDepartment?.() || { mutate: async () => {} };
  
  // Extract data from responses
  const departments = departmentsResponse?.data || [];
  const totalDepartments = departments.length;
  const employees = employeesResponse?.data?.items || [];
  
  // Employee count per department
  const getEmployeeCountByDepartment = (departmentId: string) => {
    return employees.filter((emp: any) => emp.departmentId === departmentId).length;
  };
  
  // Department manager
  const getDepartmentManager = (departmentId: string) => {
    const manager = employees.find((emp: any) => 
      emp.departmentId === departmentId && emp.isManager === true
    );
    return manager ? `${manager.lastName} ${manager.firstName}` : 'Nealocat';
  };
  
  // Total budget used
  const getDepartmentBudgetUsed = (departmentId: string) => {
    return departments.find((dept: any) => dept.id === departmentId)?.budgetUsed || 0;
  };
  
  // Total budget allocated
  const getDepartmentBudgetAllocated = (departmentId: string) => {
    return departments.find((dept: any) => dept.id === departmentId)?.budgetAllocated || 0;
  };
  
  // Budget usage percentage
  const getBudgetUsagePercentage = (departmentId: string) => {
    const budgetUsed = getDepartmentBudgetUsed(departmentId);
    const budgetAllocated = getDepartmentBudgetAllocated(departmentId);
    
    if (budgetAllocated === 0) return 0;
    return Math.min(Math.round((budgetUsed / budgetAllocated) * 100), 100);
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
  
  // Handle new department
  const handleNewDepartment = () => {
    navigate('/hr/departments/new');
  };
  
  // Handle view department
  const handleViewDepartment = (id: string) => {
    navigate(`/hr/departments/${id}`);
  };
  
  // Handle delete department
  const handleDeleteDepartment = (id: string) => {
    setDepartmentToDelete(id);
    setShowConfirmDelete(true);
  };
  
  // Confirm delete department
  const confirmDeleteDepartment = () => {
    if (departmentToDelete) {
      deleteDepartment(departmentToDelete, {
        onSuccess: () => {
          refetchDepartments();
          setShowConfirmDelete(false);
        }
      });
    }
  };
  
  // Total employee count
  const totalEmployees = employees.length;
  
  // Total budget allocated across all departments
  const totalBudgetAllocated = departments.reduce((sum: number, dept: any) => sum + dept.budgetAllocated, 0);
  
  // Total budget used across all departments
  const totalBudgetUsed = departments.reduce((sum: number, dept: any) => sum + dept.budgetUsed, 0);

  return (
    <HrLayout 
      activeTab="departments" 
      title="Departamente" 
      subtitle="Gestionarea structurii organizaționale"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total departamente"
            value={totalDepartments.toString()}
            icon={<Building size={20} />}
            color="primary"
          />
          
          <StatsCard
            title="Total angajați"
            value={totalEmployees.toString()}
            icon={<Users size={20} />}
            color="success"
          />
          
          <StatsCard
            title="Buget utilizat"
            value={`${Math.round((totalBudgetUsed / totalBudgetAllocated) * 100)}%`}
            description={`${totalBudgetUsed.toLocaleString()} / ${totalBudgetAllocated.toLocaleString()} RON`}
            icon={<Briefcase size={20} />}
            color="warning"
          />
        </div>
        
        {/* Departments Table Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <CardTitle>Structura departamentelor</CardTitle>
                <CardDescription>
                  Gestionați structura organizațională a companiei
                </CardDescription>
              </div>
              
              <Button onClick={handleNewDepartment}>
                <Plus className="mr-2 h-4 w-4" />
                Departament nou
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Caută departament..." 
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button variant="outline" size="icon" onClick={() => refetchDepartments()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Departments Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Denumire
                      {sortBy === 'name' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Angajați</TableHead>
                  <TableHead>Buget</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingDepartments ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Se încarcă departamentele...</TableCell>
                  </TableRow>
                ) : departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Nu au fost găsite departamente</TableCell>
                  </TableRow>
                ) : (
                  departments.map((department: any) => (
                    <TableRow key={department.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDepartment(department.id)}>
                      <TableCell className="font-medium">
                        {department.name}
                        <div className="text-xs text-muted-foreground mt-1">{department.code}</div>
                      </TableCell>
                      <TableCell>
                        {getDepartmentManager(department.id)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getEmployeeCountByDepartment(department.id)}</span>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{getBudgetUsagePercentage(department.id)}% utilizat</span>
                            <span>{department.budgetUsed.toLocaleString()} / {department.budgetAllocated.toLocaleString()} RON</span>
                          </div>
                          <Progress value={getBudgetUsagePercentage(department.id)} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDepartment(department.id);
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Detalii departament
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDepartment(department.id);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Șterge departament
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Department Structure Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Structura organizațională</CardTitle>
            <CardDescription>
              Vizualizare generală a structurii organizaționale a companiei
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {departments.map((d: any) => (
                <div key={d.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium text-lg">{d.name}</div>
                    <Button variant="ghost" size="sm" onClick={() => handleViewDepartment(d.id)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Detalii
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-4">
                    Manager: {getDepartmentManager(d.id)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{getEmployeeCountByDepartment(d.id)}</div>
                      <div className="text-xs text-muted-foreground">Angajați</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold">{d.budgetAllocated.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Buget alocat (RON)</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold">{d.budgetUsed.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Buget utilizat (RON)</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold">{getBudgetUsagePercentage(d.id)}%</div>
                      <div className="text-xs text-muted-foreground">Utilizare buget</div>
                    </div>
                  </div>
                  
                  {employees.filter((emp: any) => emp.departmentId === d.id).length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="text-sm font-medium mb-2">Angajați în acest departament:</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {employees.filter((emp: any) => emp.departmentId === d.id).map((emp: any) => (
                          <div key={emp.id} className="text-sm px-3 py-2 border rounded-md flex justify-between items-center">
                            <span>{emp.lastName} {emp.firstName}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => navigate(`/hr/employees/${emp.id}`)}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </HrLayout>
  );
};

export default DepartmentsPage;