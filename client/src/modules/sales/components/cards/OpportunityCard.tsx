/**
 * Opportunity Card Component
 * 
 * Reusable card component for displaying opportunity information in various contexts
 * such as lists, grids, and dashboard views.
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
  FileText,
  CheckCircle, 
  XCircle,
  Target
} from 'lucide-react';

import { Opportunity, OpportunityStage, DealPriority } from '../../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  variant?: 'default' | 'compact' | 'dashboard';
  className?: string;
  showMenuOptions?: boolean;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  variant = 'default',
  className = '',
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
  
  // Get stage color
  const getStageColor = (stage: OpportunityStage): string => {
    switch (stage) {
      case OpportunityStage.PROSPECTING:
        return 'bg-blue-100 text-blue-800';
      case OpportunityStage.QUALIFICATION:
        return 'bg-indigo-100 text-indigo-800';
      case OpportunityStage.NEEDS_ANALYSIS:
        return 'bg-purple-100 text-purple-800';
      case OpportunityStage.VALUE_PROPOSITION:
        return 'bg-pink-100 text-pink-800';
      case OpportunityStage.DECISION_MAKERS:
        return 'bg-orange-100 text-orange-800';
      case OpportunityStage.PROPOSAL:
        return 'bg-yellow-100 text-yellow-800';
      case OpportunityStage.NEGOTIATION:
        return 'bg-amber-100 text-amber-800';
      case OpportunityStage.CLOSED_WON:
        return 'bg-green-100 text-green-800';
      case OpportunityStage.CLOSED_LOST:
        return 'bg-red-100 text-red-800';
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
          <Link href={`/sales/opportunities/${opportunity.id}`} className="font-medium hover:text-primary hover:underline truncate block">
            {opportunity.title}
          </Link>
          <div className="text-sm text-muted-foreground">{opportunity.customerName}</div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <div className="text-sm font-medium">{formatCurrency(opportunity.potentialValue, opportunity.currency)}</div>
          <Badge variant="outline" className={getStageColor(opportunity.stage)}>
            {opportunity.stage === OpportunityStage.CLOSED_WON && <CheckCircle className="mr-1 h-3 w-3" />}
            {opportunity.stage === OpportunityStage.CLOSED_LOST && <XCircle className="mr-1 h-3 w-3" />}
            {opportunity.stage}
          </Badge>
        </div>
      </div>
    );
  }
  
  if (variant === 'dashboard') {
    return (
      <Card className={`${className}`}>
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <Link href={`/sales/opportunities/${opportunity.id}`} className="hover:text-primary hover:underline">
                <CardTitle className="text-sm">{opportunity.title}</CardTitle>
              </Link>
              <CardDescription className="text-xs flex items-center mt-1">
                <User className="h-3 w-3 mr-1" /> {opportunity.customerName}
              </CardDescription>
            </div>
            <Badge variant="outline" className={getStageColor(opportunity.stage)}>
              {opportunity.stage}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="flex items-center text-sm mb-1">
            <DollarSign className="h-3 w-3 mr-1" />
            <span>{formatCurrency(opportunity.potentialValue, opportunity.currency)}</span>
          </div>
          <div className="flex items-center text-xs">
            <Target className="h-3 w-3 mr-1" />
            <span>Probabilitate: {opportunity.probability}%</span>
          </div>
        </CardContent>
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
              <Link href={`/sales/opportunities/${opportunity.id}`} className="hover:text-primary hover:underline">
                {opportunity.title}
              </Link>
            </CardTitle>
            <CardDescription>{opportunity.customerName}</CardDescription>
          </div>
          <Badge variant="outline" className={getStageColor(opportunity.stage)}>
            {opportunity.stage === OpportunityStage.CLOSED_WON && <CheckCircle className="mr-1 h-3 w-3" />}
            {opportunity.stage === OpportunityStage.CLOSED_LOST && <XCircle className="mr-1 h-3 w-3" />}
            {opportunity.stage}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Valoare Potențială</p>
            <p className="text-lg font-medium">{formatCurrency(opportunity.potentialValue, opportunity.currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Probabilitate</p>
            <p className="text-lg font-medium">{opportunity.probability}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Prioritate</p>
            <Badge variant="outline" className={getPriorityColor(opportunity.priority)}>
              {opportunity.priority}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dată Estimată Finalizare</p>
            <p>{formatDate(opportunity.expectedCloseDate)}</p>
          </div>
        </div>
      </CardContent>
      {showMenuOptions && (
        <CardFooter className="flex justify-end space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/sales/opportunities/${opportunity.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Vezi detalii
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/sales/opportunities/${opportunity.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editează
            </Link>
          </Button>
          {opportunity.stage !== OpportunityStage.CLOSED_WON && opportunity.stage !== OpportunityStage.CLOSED_LOST && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/sales/opportunities/${opportunity.id}/convert`}>
                <FileText className="mr-2 h-4 w-4" />
                Convertește în contract
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default OpportunityCard;