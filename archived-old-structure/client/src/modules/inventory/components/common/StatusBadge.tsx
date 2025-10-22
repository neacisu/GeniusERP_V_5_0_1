/**
 * Status Badge Component
 * 
 * A reusable badge for displaying status information in the inventory module
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  // Determine badge styling based on status
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'finalizat':
      case 'activ':
      case 'active':
      case 'approved':
      case 'aprobat':
      case 'normal': // Adăugat pentru nivelurile de stoc
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'pending':
      case 'in progress':
      case 'in curs':
      case 'in asteptare':
      case 'waiting':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case 'canceled':
      case 'anulat':
      case 'rejected':
      case 'respins':
      case 'low': // Adăugat pentru nivelurile de stoc
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case 'archived':
      case 'arhivat':
      case 'inactive':
      case 'inactiv':
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case 'high': // Adăugat pentru nivelurile de stoc
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(getVariant(status), "border-0 font-medium", className)}
    >
      {status}
    </Badge>
  );
};

export default StatusBadge;