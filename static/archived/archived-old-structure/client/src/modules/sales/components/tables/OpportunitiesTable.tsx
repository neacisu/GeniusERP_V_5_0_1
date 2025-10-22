/**
 * Opportunities Table Component
 * 
 * Reusable component for displaying sales opportunities in a table format with
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { Opportunity, OpportunityStage } from '../../types';
import { formatDate, formatCurrency, formatPercentage } from '../../utils/formatters';
import { getOpportunityStageColor, getPriorityColor } from '../../utils/statusColors';

interface OpportunitiesTableProps {
  opportunities: any;
  isLoading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  emptyState: React.ReactNode;
}

const OpportunitiesTable: React.FC<OpportunitiesTableProps> = ({
  opportunities,
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

  // Check if opportunities are empty
  const hasNoOpportunities = !opportunities || 
    ('count' in opportunities && opportunities.count === 0) || 
    ('data' in opportunities && opportunities.data.length === 0);

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
                Titlu Oportunitate {getSortIcon('title')}
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
                onClick={() => onSort('potentialValue')}
              >
                Valoare {getSortIcon('potentialValue')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('stage')}
              >
                Stadiu {getSortIcon('stage')}
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
                onClick={() => onSort('probability')}
              >
                Probabilitate {getSortIcon('probability')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex cursor-pointer items-center"
                onClick={() => onSort('expectedCloseDate')}
              >
                Dată Estimată {getSortIcon('expectedCloseDate')}
              </div>
            </TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            renderSkeletons()
          ) : hasNoOpportunities ? (
            <TableRow>
              <TableCell colSpan={8}>
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            'data' in opportunities && opportunities.data.map((opportunity: Opportunity) => (
              <TableRow key={opportunity.id}>
                <TableCell className="font-medium">
                  <Link href={`/sales/opportunities/${opportunity.id}`} className="hover:text-primary hover:underline">
                    {opportunity.title}
                  </Link>
                </TableCell>
                <TableCell>{opportunity.customerName}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(opportunity.potentialValue, opportunity.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getOpportunityStageColor(opportunity.stage)}>
                    {opportunity.stage === OpportunityStage.CLOSED_WON && <CheckCircle className="mr-1 h-3 w-3" />}
                    {opportunity.stage === OpportunityStage.CLOSED_LOST && <XCircle className="mr-1 h-3 w-3" />}
                    {opportunity.stage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPriorityColor(opportunity.priority)}>
                    {opportunity.priority}
                  </Badge>
                </TableCell>
                <TableCell>{formatPercentage(opportunity.probability)}</TableCell>
                <TableCell>
                  {formatDate(opportunity.expectedCloseDate)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/sales/opportunities/${opportunity.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Vezi detalii
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/sales/opportunities/${opportunity.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editează
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {opportunity.stage !== OpportunityStage.CLOSED_WON && (
                        <DropdownMenuItem asChild>
                          <Link href={`/sales/opportunities/${opportunity.id}/convert`}>
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

export default OpportunitiesTable;