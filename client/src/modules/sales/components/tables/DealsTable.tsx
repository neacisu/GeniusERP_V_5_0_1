/**
 * Deals Table Component
 * 
 * Reusable component for displaying deals in a table format with
 * sorting and action functionality.
 */

import React from 'react';
import { Link } from 'wouter';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  MoreHorizontal,
  FileText,
  Edit,
  Eye,
  Trash2,
  FileSignature,
  FileCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { Deal, DealStatus } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getDealStatusColor, getPriorityColor } from '../../utils/statusColors';

interface DealsTableProps {
  deals: any;
  isLoading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  emptyState: React.ReactNode;
}

const DealsTable: React.FC<DealsTableProps> = ({
  deals,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  emptyState
}) => {
  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-10" /></TableCell>
      </TableRow>
    ));
  };

  // Check if deals are empty
  const hasNoDeals = !deals || 
    ('count' in deals && deals.count === 0) || 
    ('data' in deals && deals.data.length === 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('title')}
              >
                Titlu Contract {getSortIcon('title')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('customerName')}
              >
                Client {getSortIcon('customerName')}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div 
                className="flex cursor-pointer items-center justify-end"
                onClick={() => onSort('value')}
              >
                Valoare {getSortIcon('value')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('status')}
              >
                Status {getSortIcon('status')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('priority')}
              >
                Prioritate {getSortIcon('priority')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('startDate')}
              >
                Dată Start {getSortIcon('startDate')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('endDate')}
              >
                Dată Finalizare {getSortIcon('endDate')}
              </div>
            </TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            renderSkeletons()
          ) : hasNoDeals ? (
            <TableRow>
              <TableCell colSpan={8}>
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            'data' in deals && deals.data.map((deal: Deal) => (
              <TableRow key={deal.id}>
                <TableCell className="font-medium">
                  <Link href={`/sales/deals/${deal.id}`} className="hover:text-primary hover:underline">
                    {deal.title}
                  </Link>
                </TableCell>
                <TableCell>{deal.customerName}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(deal.value, deal.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getDealStatusColor(deal.status)}>
                    {deal.status === DealStatus.WON && <CheckCircle className="mr-1 h-3 w-3" />}
                    {deal.status === DealStatus.LOST && <XCircle className="mr-1 h-3 w-3" />}
                    {deal.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPriorityColor(deal.priority)}>
                    {deal.priority}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(deal.startDate)}</TableCell>
                <TableCell>{formatDate(deal.endDate)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/sales/deals/${deal.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Vezi detalii
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/sales/deals/${deal.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editează
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {deal.status === DealStatus.WON && (
                        <DropdownMenuItem asChild>
                          <Link href={`/invoicing/create?dealId=${deal.id}`}>
                            <FileSignature className="mr-2 h-4 w-4" />
                            Crează factură
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/sales/deals/${deal.id}/documents`}>
                          <FileCheck className="mr-2 h-4 w-4" />
                          Documente
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Șterge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DealsTable;