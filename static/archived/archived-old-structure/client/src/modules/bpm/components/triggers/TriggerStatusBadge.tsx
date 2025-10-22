/**
 * Trigger Status Badge Component
 * 
 * Componentă pentru afișarea statutului unui trigger sub formă de badge
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface TriggerStatusBadgeProps {
  status: string;
}

const TriggerStatusBadge: React.FC<TriggerStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'active':
      return <Badge variant="outline" className="bg-green-500 hover:bg-green-500 text-white border-0">Activ</Badge>;
    case 'inactive':
      return <Badge variant="outline" className="bg-gray-400 hover:bg-gray-400 text-white border-0">Inactiv</Badge>;
    case 'error':
      return <Badge variant="destructive">Eroare</Badge>;
    case 'pending':
      return <Badge variant="outline" className="border-amber-500 text-amber-500">În așteptare</Badge>;
    case 'processing':
      return <Badge variant="outline" className="bg-blue-500 hover:bg-blue-500 text-white border-0">În procesare</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default TriggerStatusBadge;