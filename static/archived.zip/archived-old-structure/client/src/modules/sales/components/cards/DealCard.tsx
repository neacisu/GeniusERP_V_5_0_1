/**
 * Deal Card Component
 * 
 * Reusable card component for displaying deal information in various contexts
 * such as lists, grids, and pipeline views.
 */

import React from 'react';
import { Link } from 'wouter';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  User, 
  DollarSign, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2,
  FileSignature,
  FileCheck,
  CheckCircle, 
  XCircle
} from 'lucide-react';

import { Deal, DealStatus, DealPriority } from '../../types';

interface DealCardProps {
  deal: Deal;
  variant?: 'default' | 'compact' | 'pipeline';
  className?: string;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string, currentStageId: string) => void;
  stageId?: string;
  showMenuOptions?: boolean;
}

const DealCard: React.FC<DealCardProps> = ({
  deal,
  variant = 'default',
  className = '',
  isDraggable = false,
  onDragStart,
  stageId,
  showMenuOptions = true
}) => {
  // Format currency
  const formatCurrency = (value: number, currency: string) => {
    return `${value.toLocaleString('ro-RO')} ${currency}`;
  };
  
  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Get status color
  const getStatusColor = (status: DealStatus): string => {
    switch (status) {
      case DealStatus.NEW:
        return 'bg-blue-100 text-blue-800';
      case DealStatus.NEGOTIATION:
        return 'bg-yellow-100 text-yellow-800';
      case DealStatus.PROPOSAL:
        return 'bg-purple-100 text-purple-800';
      case DealStatus.WON:
        return 'bg-green-100 text-green-800';
      case DealStatus.LOST:
        return 'bg-red-100 text-red-800';
      case DealStatus.CANCELED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get priority color
  const getPriorityColor = (priority: DealPriority): string => {
    switch (priority) {
      case DealPriority.LOW:
        return 'bg-blue-100 text-blue-800';
      case DealPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case DealPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case DealPriority.URGENT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between border-b p-3 ${className}`}>
        <div className="flex-1 min-w-0">
          <Link href={`/sales/deals/${deal.id}`} className="font-medium hover:text-primary hover:underline truncate block">
            {deal.title}
          </Link>
          <div className="text-sm text-muted-foreground">{deal.customerName}</div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <div className="text-sm font-medium">{formatCurrency(deal.value, deal.currency)}</div>
          <Badge variant="outline" className={getStatusColor(deal.status)}>
            {deal.status === DealStatus.WON && <CheckCircle className="mr-1 h-3 w-3" />}
            {deal.status === DealStatus.LOST && <XCircle className="mr-1 h-3 w-3" />}
            {deal.status}
          </Badge>
        </div>
      </div>
    );
  }
  
  if (variant === 'pipeline') {
    return (
      <Card 
        className={`mb-3 cursor-move ${className}`} 
        draggable={isDraggable}
        onDragStart={onDragStart ? (e) => onDragStart(e, deal.id, stageId || '') : undefined}
      >
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-start">
            <Link href={`/sales/deals/${deal.id}`} className="hover:text-primary hover:underline">
              <CardTitle className="text-sm">{deal.title}</CardTitle>
            </Link>
            {showMenuOptions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
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
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardDescription className="text-xs mt-1 flex items-center">
            <User className="h-3 w-3 mr-1" /> {deal.customerName}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="flex items-center text-sm mb-1">
            <DollarSign className="h-3 w-3 mr-1" />
            <span>{formatCurrency(deal.value, deal.currency)}</span>
          </div>
          {deal.endDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Termen: {formatDate(deal.endDate)}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-3 pt-0 flex justify-between items-center">
          <Badge variant="outline" className={getPriorityColor(deal.priority)}>
            {deal.priority}
          </Badge>
          {deal.probability && (
            <span className="text-xs text-muted-foreground">{deal.probability}%</span>
          )}
        </CardFooter>
      </Card>
    );
  }
  
  // Default variant
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              <Link href={`/sales/deals/${deal.id}`} className="hover:text-primary hover:underline">
                {deal.title}
              </Link>
            </CardTitle>
            <CardDescription>{deal.customerName}</CardDescription>
          </div>
          <Badge variant="outline" className={getStatusColor(deal.status)}>
            {deal.status === DealStatus.WON && <CheckCircle className="mr-1 h-3 w-3" />}
            {deal.status === DealStatus.LOST && <XCircle className="mr-1 h-3 w-3" />}
            {deal.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Valoare</p>
            <p className="text-lg font-medium">{formatCurrency(deal.value, deal.currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Prioritate</p>
            <Badge variant="outline" className={getPriorityColor(deal.priority)}>
              {deal.priority}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dată Start</p>
            <p>{formatDate(deal.startDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dată Finalizare</p>
            <p>{formatDate(deal.endDate)}</p>
          </div>
        </div>
      </CardContent>
      {showMenuOptions && (
        <CardFooter className="flex justify-end space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/sales/deals/${deal.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Vezi detalii
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/sales/deals/${deal.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editează
            </Link>
          </Button>
          {deal.status === DealStatus.WON && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/invoicing/create?dealId=${deal.id}`}>
                <FileSignature className="mr-2 h-4 w-4" />
                Crează factură
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default DealCard;