/**
 * Quote Card Component
 * 
 * Reusable card component for displaying quote information in various contexts
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
  FileSignature,
  Download,
  Mail,
  CheckCircle, 
  XCircle
} from 'lucide-react';

import { Quote, QuoteStatus } from '../../types';

interface QuoteCardProps {
  quote: Quote;
  variant?: 'default' | 'compact' | 'dashboard';
  className?: string;
  showMenuOptions?: boolean;
  onDownloadPdf?: (quoteId: string) => Promise<void>;
}

const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  variant = 'default',
  className = '',
  showMenuOptions = true,
  onDownloadPdf
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
  const getStatusColor = (status: QuoteStatus): string => {
    switch (status) {
      case QuoteStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case QuoteStatus.SENT:
        return 'bg-blue-100 text-blue-800';
      case QuoteStatus.VIEWED:
        return 'bg-purple-100 text-purple-800';
      case QuoteStatus.ACCEPTED:
        return 'bg-green-100 text-green-800';
      case QuoteStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case QuoteStatus.EXPIRED:
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle download PDF
  const handleDownload = async () => {
    if (onDownloadPdf) {
      await onDownloadPdf(quote.id);
    }
  };
  
  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between border-b p-3 ${className}`}>
        <div className="flex-1 min-w-0">
          <Link href={`/sales/quotes/${quote.id}`} className="font-medium hover:text-primary hover:underline truncate block">
            {quote.quoteNumber} - {quote.title}
          </Link>
          <div className="text-sm text-muted-foreground">{quote.customerName}</div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <div className="text-sm font-medium">{formatCurrency(quote.value, quote.currency)}</div>
          <Badge variant="outline" className={getStatusColor(quote.status)}>
            {quote.status === QuoteStatus.ACCEPTED && <CheckCircle className="mr-1 h-3 w-3" />}
            {quote.status === QuoteStatus.REJECTED && <XCircle className="mr-1 h-3 w-3" />}
            {quote.status}
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
              <Link href={`/sales/quotes/${quote.id}`} className="hover:text-primary hover:underline">
                <CardTitle className="text-sm">{quote.quoteNumber}</CardTitle>
              </Link>
              <CardDescription className="text-xs">{quote.title}</CardDescription>
            </div>
            <Badge variant="outline" className={getStatusColor(quote.status)}>
              {quote.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="flex items-center text-sm mb-1">
            <User className="h-3 w-3 mr-1" /> 
            <span>{quote.customerName}</span>
          </div>
          <div className="flex items-center text-sm mb-1">
            <DollarSign className="h-3 w-3 mr-1" />
            <span>{formatCurrency(quote.value, quote.currency)}</span>
          </div>
          <div className="flex items-center text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Valabil până la: {formatDate(quote.validUntil)}</span>
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
              <Link href={`/sales/quotes/${quote.id}`} className="hover:text-primary hover:underline">
                {quote.quoteNumber} - {quote.title}
              </Link>
            </CardTitle>
            <CardDescription>{quote.customerName}</CardDescription>
          </div>
          <Badge variant="outline" className={getStatusColor(quote.status)}>
            {quote.status === QuoteStatus.ACCEPTED && <CheckCircle className="mr-1 h-3 w-3" />}
            {quote.status === QuoteStatus.REJECTED && <XCircle className="mr-1 h-3 w-3" />}
            {quote.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Valoare</p>
            <p className="text-lg font-medium">{formatCurrency(quote.value, quote.currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dată emitere</p>
            <p>{formatDate(quote.issueDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valabil până la</p>
            <p>{formatDate(quote.validUntil)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Stare</p>
            <Badge variant="outline" className={getStatusColor(quote.status)}>
              {quote.status}
            </Badge>
          </div>
        </div>
      </CardContent>
      {showMenuOptions && (
        <CardFooter className="flex justify-end space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/sales/quotes/${quote.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Vezi detalii
            </Link>
          </Button>
          {quote.status === QuoteStatus.DRAFT && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/sales/quotes/${quote.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editează
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Descarcă PDF
          </Button>
          {quote.status === QuoteStatus.DRAFT && (
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Trimite către client
            </Button>
          )}
          {quote.status === QuoteStatus.ACCEPTED && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/sales/quotes/${quote.id}/convert`}>
                <FileSignature className="mr-2 h-4 w-4" />
                Convertește în contract
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default QuoteCard;