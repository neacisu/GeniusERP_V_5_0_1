/**
 * Quotes Table Component
 * 
 * Reusable component for displaying sales quotes/offers in a table format with
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  MoreHorizontal,
  FileText,
  Edit,
  Eye,
  Trash2,
  File,
  Send,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { Quote, QuoteStatus } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getQuoteStatusColor } from '../../utils/statusColors';

interface QuotesTableProps {
  quotes: any;
  isLoading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  emptyState: React.ReactNode;
}

const QuotesTable: React.FC<QuotesTableProps> = ({
  quotes,
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

  // Check if quotes are empty
  const hasNoQuotes = !quotes || 
    ('count' in quotes && quotes.count === 0) || 
    ('data' in quotes && quotes.data.length === 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('quoteNumber')}
              >
                Număr Ofertă {getSortIcon('quoteNumber')}
              </div>
            </TableHead>
            <TableHead className="w-[300px]">
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('title')}
              >
                Titlu Ofertă {getSortIcon('title')}
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
                onClick={() => onSort('issueDate')}
              >
                Dată Emitere {getSortIcon('issueDate')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('validUntil')}
              >
                Valabilă Până La {getSortIcon('validUntil')}
              </div>
            </TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            renderSkeletons()
          ) : hasNoQuotes ? (
            <TableRow>
              <TableCell colSpan={8}>
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            'data' in quotes && quotes.data.map((quote: Quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">
                  <Link href={`/sales/quotes/${quote.id}`} className="hover:text-primary hover:underline">
                    {quote.quoteNumber}
                  </Link>
                </TableCell>
                <TableCell>{quote.title}</TableCell>
                <TableCell>{quote.customerName}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(quote.value, quote.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getQuoteStatusColor(quote.status)}>
                    {quote.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(quote.issueDate)}</TableCell>
                <TableCell>{formatDate(quote.validUntil)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/sales/quotes/${quote.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Vezi detalii
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/sales/quotes/${quote.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editează
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/sales/quotes/${quote.id}/pdf`}>
                          <File className="mr-2 h-4 w-4" />
                          Exportă PDF
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/sales/quotes/${quote.id}/send`}>
                          <Send className="mr-2 h-4 w-4" />
                          Trimite email
                        </Link>
                      </DropdownMenuItem>
                      {quote.status === QuoteStatus.ACCEPTED && (
                        <DropdownMenuItem asChild>
                          <Link href={`/sales/quotes/${quote.id}/convert`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Convertește în contract
                          </Link>
                        </DropdownMenuItem>
                      )}
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

export default QuotesTable;