/**
 * Process Status Badge Component
 * 
 * Componentă pentru afișarea statutului unui proces sub formă de badge
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface ProcessStatusBadgeProps {
  status: string;
}

const ProcessStatusBadge: React.FC<ProcessStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'active':
      return <Badge variant="outline" className="bg-green-500 hover:bg-green-500 text-white border-0">Activ</Badge>;
    case 'draft':
      return <Badge variant="outline" className="bg-gray-400 hover:bg-gray-400 text-white border-0">Ciornă</Badge>;
    case 'inactive':
      return <Badge variant="outline" className="border-gray-500 text-gray-500">Inactiv</Badge>;
    case 'error':
      return <Badge variant="destructive">Eroare</Badge>;
    case 'running':
      return <Badge variant="outline" className="bg-blue-500 hover:bg-blue-500 text-white border-0">În execuție</Badge>;
    case 'pending':
      return <Badge variant="outline" className="border-amber-500 text-amber-500">În așteptare</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-indigo-500 hover:bg-indigo-500 text-white border-0">Complet</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default ProcessStatusBadge;