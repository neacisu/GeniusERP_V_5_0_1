import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  ChevronDown,
  Edit,
  FileText,
  Calendar,
  ExternalLink,
  Trash2,
  FileCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Employee } from '../../types';
import { formatDate, getEmployeeStatusColor } from '../../utils/helpers';

interface EmployeesTableProps {
  employees: Employee[];
  isLoading?: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onSort?: (column: string) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onToggleStatus?: (id: string, currentStatus: boolean) => void;
  onShowDetails?: (id: string) => void;
}

type SortableColumn = 'name' | 'position' | 'department' | 'email' | 'createdAt';

/**
 * Reusable Employees Table Component
 * Displays employees with pagination, sorting and actions
 */
const EmployeesTable: React.FC<EmployeesTableProps> = ({
  employees,
  isLoading = false,
  total,
  page,
  limit,
  onPageChange,
  onSort,
  sortBy,
  sortDirection = 'asc',
  onToggleStatus,
  onShowDetails
}) => {
  // Calculate total pages
  const totalPages = Math.ceil(total / limit) || 1;
  
  // Handle sort click
  const handleSort = (column: SortableColumn) => {
    if (onSort) {
      onSort(column);
    }
  };
  
  // Get sort indicator arrow
  const getSortIndicator = (column: SortableColumn) => {
    if (sortBy !== column) return null;
    
    return sortDirection === 'asc' ? 
      <ChevronDown className="ml-2 h-4 w-4" /> : 
      <ChevronDown className="ml-2 h-4 w-4 transform rotate-180" />;
  };
  
  // Format name for display and avatar
  const getFullName = (employee: Employee) => {
    return `${employee.firstName} ${employee.lastName}`;
  };
  
  // Get avatar initials
  const getInitials = (employee: Employee) => {
    return `${employee.firstName[0]}${employee.lastName[0]}`;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Se încarcă angajații...</p>
      </div>
    );
  }
  
  // Empty state
  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-medium mb-2">Nu există angajați</p>
        <p className="text-muted-foreground">Nu au fost găsiți angajați pentru criteriile selectate</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">
              <Button 
                variant="ghost" 
                className="p-0 font-medium flex items-center"
                onClick={() => handleSort('name')}
              >
                Angajat
                {getSortIndicator('name') || <ArrowUpDown className="ml-2 h-4 w-4" />}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                className="p-0 font-medium flex items-center"
                onClick={() => handleSort('position')}
              >
                Funcție
                {getSortIndicator('position') || <ArrowUpDown className="ml-2 h-4 w-4" />}
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button 
                variant="ghost" 
                className="p-0 font-medium flex items-center"
                onClick={() => handleSort('department')}
              >
                Departament
                {getSortIndicator('department') || <ArrowUpDown className="ml-2 h-4 w-4" />}
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button 
                variant="ghost" 
                className="p-0 font-medium flex items-center"
                onClick={() => handleSort('email')}
              >
                Email
                {getSortIndicator('email') || <ArrowUpDown className="ml-2 h-4 w-4" />}
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button 
                variant="ghost" 
                className="p-0 font-medium flex items-center"
                onClick={() => handleSort('createdAt')}
              >
                Data angajării
                {getSortIndicator('createdAt') || <ArrowUpDown className="ml-2 h-4 w-4" />}
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getFullName(employee)}`} />
                    <AvatarFallback>{getInitials(employee)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{getFullName(employee)}</p>
                    <p className="text-xs text-muted-foreground md:hidden">{employee.position}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{employee.position}</TableCell>
              <TableCell className="hidden md:table-cell">{employee.department || '-'}</TableCell>
              <TableCell className="hidden md:table-cell">
                <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                  {employee.email}
                </a>
              </TableCell>
              <TableCell className="hidden md:table-cell">{formatDate(employee.createdAt)}</TableCell>
              <TableCell>
                <Badge className={getEmployeeStatusColor(employee.isActive)}>
                  {employee.isActive ? 'Activ' : 'Inactiv'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {onShowDetails && (
                      <DropdownMenuItem onClick={() => onShowDetails(employee.id)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Detalii rapide
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link href={`/hr/employees/${employee.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Detalii complete
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href={`/hr/employees/${employee.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editează
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href={`/hr/contracts/new?employeeId=${employee.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Contract nou
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href={`/hr/absences/new?employeeId=${employee.id}`}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Absență nouă
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {onToggleStatus && (
                      <DropdownMenuItem 
                        onClick={() => onToggleStatus(employee.id, employee.isActive)}
                        className={employee.isActive ? "text-red-600" : "text-green-600"}
                      >
                        {employee.isActive ? (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Dezactivează
                          </>
                        ) : (
                          <>
                            <FileCheck className="mr-2 h-4 w-4" />
                            Activează
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Afișare {(page - 1) * limit + 1}-{Math.min(page * limit, total)} din {total} angajați
        </p>
        
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => onPageChange(Math.max(page - 1, 1))}
                disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {/* Generate limited page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              const pagesToShow = 5;
              const startPage = Math.max(1, page - Math.floor(pagesToShow / 2));
              const endPage = Math.min(totalPages, startPage + pagesToShow - 1);
              const currentPage = startPage + i;
              
              if (currentPage <= endPage) {
                return (
                  <PaginationItem key={currentPage}>
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => onPageChange(currentPage)}
                    >
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => onPageChange(Math.min(page + 1, totalPages))}
                disabled={page === totalPages}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default EmployeesTable;