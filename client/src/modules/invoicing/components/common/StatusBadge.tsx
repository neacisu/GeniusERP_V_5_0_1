/**
 * Status Badge Component
 * 
 * Displays a styled badge for invoice status.
 */
import { Badge } from '@/components/ui/badge';
import { InvoiceStatus } from '../../types';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  // Define styles based on status
  const getStatusStyle = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200";
      case InvoiceStatus.PENDING:
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200";
      case InvoiceStatus.VALIDATED:
        return "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200";
      case InvoiceStatus.PAID:
        return "bg-green-100 text-green-700 hover:bg-green-100 border-green-200";
      case InvoiceStatus.OVERDUE:
        return "bg-red-100 text-red-700 hover:bg-red-100 border-red-200";
      case InvoiceStatus.CANCELED:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200";
      case InvoiceStatus.PARTIAL:
        return "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Define label based on status
  const getStatusLabel = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return "Ciornă";
      case InvoiceStatus.PENDING:
        return "În așteptare";
      case InvoiceStatus.VALIDATED:
        return "Validată";
      case InvoiceStatus.PAID:
        return "Plătită";
      case InvoiceStatus.OVERDUE:
        return "Depășită";
      case InvoiceStatus.CANCELED:
        return "Anulată";
      case InvoiceStatus.PARTIAL:
        return "Plată parțială";
      default:
        return status;
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={getStatusStyle(status)}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}