import React from 'react';
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
  FileCheck,
  FileX,
  Printer,
  File,
  Calendar
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
import { Contract } from '../../types';
import { formatDate, formatCurrency, getContractStatusColor } from '../../utils/helpers';

interface ContractsTableProps {
  contracts: Contract[];
  isLoading?: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onSort?: (column: string) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onChangeStatus?: (id: string, status: string) => void;
  onPrintContract?: (id: string) => void;
}

type SortableColumn = 'employeeName' | 'contractNumber' | 'startDate' | 'endDate' | 'salary' | 'status';

/**
 * Reusable Contracts Table Component
 * Displays employment contracts with pagination, sorting and actions
 */
const ContractsTable: React.FC<ContractsTableProps> = ({
  contracts,
  isLoading = false,
  total,
  page,
  limit,
  onPageChange,
  onSort,
  sortBy,
  sortDirection = 'asc',
  onChangeStatus,
  onPrintContract
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
  
  // Format status for display
  const formatContractStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'active': 'Activ',
      'pending': 'În așteptare',
      'expired': 'Expirat',
      'terminated': 'Încetat',
      'draft': 'Ciornă'
    };
    
    return statusMap[status] || status;
  };
  
  // Get contract type display name
  const getContractType = (type: string) => {
    const typeMap: Record<string, string> = {
      'full_time': 'Normă întreagă',
      'part_time': 'Timp parțial',
      'temporary': 'Perioadă determinată',
      'seasonal': 'Sezonier',
      'internship': 'Internship'
    };
    
    return typeMap[type] || type;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Se încarcă contractele...</p>
      </div>
    );
  }
  
  // Empty state
  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-medium mb-2">Nu există contracte</p>
        <p className="text-muted-foreground">Nu au fost găsite contracte pentru criteriile selectate</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              <Button 
                variant="ghost" 
                className="p-0 font-medium flex items-center"
                onClick={() => handleSort('employeeName')}
              >
                Angajat
                {getSortIndicator('employeeName') || <ArrowUpDown className="ml-2 h-4 w-4" />}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                className="p-0 font-medium flex items-center"
                onClick={() => handleSort('contractNumber')}
              >
                Nr. contract
                {getSortIndicator('contractNumber') || <ArrowUpDown className="ml-2 h-4 w-4" />}
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button 
                variant="ghost" 
                className="p-0 font-medium flex items-center"
                onClick={() => handleSort('startDate')}
              >
                Perioadă
                {getSortIndicator('startDate') || <ArrowUpDown className="ml-2 h-4 w-4" />}
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button 
                variant="ghost" 
                className="p-0 font-medium flex items-center"
                onClick={() => handleSort('salary')}
              >
                Salariu
                {getSortIndicator('salary') || <ArrowUpDown className="ml-2 h-4 w-4" />}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                className="p-0 font-medium flex items-center"
                onClick={() => handleSort('status')}
              >
                Status
                {getSortIndicator('status') || <ArrowUpDown className="ml-2 h-4 w-4" />}
              </Button>
            </TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium">
                {/* Normally we'd use the employee name from joined data */}
                {contract.employeeName || `Angajat #${contract.employeeId}`}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{contract.contractNumber}</span>
                  <span className="text-xs text-muted-foreground">{getContractType(contract.contractType)}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-col">
                  <span>Început: {formatDate(contract.startDate)}</span>
                  {contract.endDate && (
                    <span className="text-xs text-muted-foreground">
                      Sfârșit: {formatDate(contract.endDate)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatCurrency(contract.grossSalary)}
              </TableCell>
              <TableCell>
                <Badge className={getContractStatusColor(contract.status)}>
                  {formatContractStatus(contract.status)}
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
                    
                    <DropdownMenuItem asChild>
                      <Link href={`/hr/contracts/${contract.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Detalii contract
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href={`/hr/contracts/${contract.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editează
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href={`/hr/employees/${contract.employeeId}`}>
                        <File className="mr-2 h-4 w-4" />
                        Dosar angajat
                      </Link>
                    </DropdownMenuItem>
                    
                    {onPrintContract && (
                      <DropdownMenuItem onClick={() => onPrintContract(contract.id)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Printează contract
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    {onChangeStatus && contract.status !== 'active' && (
                      <DropdownMenuItem 
                        onClick={() => onChangeStatus(contract.id, 'active')}
                        className="text-green-600"
                      >
                        <FileCheck className="mr-2 h-4 w-4" />
                        Activează contract
                      </DropdownMenuItem>
                    )}
                    
                    {onChangeStatus && contract.status === 'active' && (
                      <DropdownMenuItem 
                        onClick={() => onChangeStatus(contract.id, 'terminated')}
                        className="text-red-600"
                      >
                        <FileX className="mr-2 h-4 w-4" />
                        Încetează contract
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link href={`/hr/absences/new?employeeId=${contract.employeeId}`}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Înregistrează absență
                      </Link>
                    </DropdownMenuItem>
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
          Afișare {(page - 1) * limit + 1}-{Math.min(page * limit, total)} din {total} contracte
        </p>
        
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => page > 1 ? onPageChange(Math.max(page - 1, 1)) : undefined}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
                onClick={() => page < totalPages ? onPageChange(Math.min(page + 1, totalPages)) : undefined}
                className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default ContractsTable;