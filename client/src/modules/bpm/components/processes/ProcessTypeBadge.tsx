/**
 * Process Type Badge Component
 * 
 * Componentă pentru afișarea tipului unui proces sub formă de badge
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface ProcessTypeBadgeProps {
  type: string;
}

const ProcessTypeBadge: React.FC<ProcessTypeBadgeProps> = ({ type }) => {
  switch (type) {
    case 'standard':
      return <Badge variant="outline" className="border-blue-500 text-blue-500">Standard</Badge>;
    case 'automated':
      return <Badge variant="outline" className="border-green-500 text-green-500">Automatizat</Badge>;
    case 'approval':
      return <Badge variant="outline" className="border-amber-500 text-amber-500">Aprobare</Badge>;
    case 'notification':
      return <Badge variant="outline" className="border-purple-500 text-purple-500">Notificare</Badge>;
    case 'integration':
      return <Badge variant="outline" className="border-indigo-500 text-indigo-500">Integrare</Badge>;
    case 'finance':
      return <Badge variant="outline" className="border-emerald-500 text-emerald-500">Financiar</Badge>;
    case 'hr':
      return <Badge variant="outline" className="border-pink-500 text-pink-500">HR</Badge>;
    case 'sales':
      return <Badge variant="outline" className="border-blue-600 text-blue-600">Vânzări</Badge>;
    case 'procurement':
      return <Badge variant="outline" className="border-teal-500 text-teal-500">Achiziții</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default ProcessTypeBadge;