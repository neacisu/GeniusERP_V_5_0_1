/**
 * Trigger Type Badge Component
 * 
 * Componentă pentru afișarea tipului unui trigger sub formă de badge
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface TriggerTypeBadgeProps {
  type: string;
}

const TriggerTypeBadge: React.FC<TriggerTypeBadgeProps> = ({ type }) => {
  switch (type) {
    case 'schedule':
      return <Badge variant="outline" className="border-blue-500 text-blue-500">Programat</Badge>;
    case 'event':
      return <Badge variant="outline" className="border-amber-500 text-amber-500">Eveniment</Badge>;
    case 'webhook':
      return <Badge variant="outline" className="border-purple-500 text-purple-500">Webhook</Badge>;
    case 'email':
      return <Badge variant="outline" className="border-green-500 text-green-500">Email</Badge>;
    case 'manual':
      return <Badge variant="outline" className="border-gray-500 text-gray-500">Manual</Badge>;
    case 'database':
      return <Badge variant="outline" className="border-blue-700 text-blue-700">Bază de date</Badge>;
    case 'file':
      return <Badge variant="outline" className="border-teal-500 text-teal-500">Fișier</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default TriggerTypeBadge;