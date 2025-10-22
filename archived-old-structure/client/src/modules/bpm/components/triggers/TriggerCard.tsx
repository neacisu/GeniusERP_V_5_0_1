/**
 * Trigger Card Component
 * 
 * Componenta pentru afișarea unui trigger în format de card
 */

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Play, Zap, Clock, Webhook, Mail, AlarmClock } from 'lucide-react';
import { format } from 'date-fns';

export interface TriggerCardProps {
  trigger: {
    id: string;
    name: string;
    description?: string;
    type: 'schedule' | 'event' | 'webhook' | 'email' | 'manual';
    status: 'active' | 'inactive' | 'error';
    lastTriggered?: string;
    nextExecution?: string;
    processName: string;
    processId: string;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, enabled: boolean) => void;
  onTriggerNow: (id: string) => void;
}

const TriggerCard: React.FC<TriggerCardProps> = ({
  trigger,
  onEdit,
  onDelete,
  onStatusChange,
  onTriggerNow
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };
  
  const getTriggerIcon = () => {
    switch (trigger.type) {
      case 'schedule':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'event':
        return <Zap className="h-5 w-5 text-amber-500" />;
      case 'webhook':
        return <Webhook className="h-5 w-5 text-purple-500" />;
      case 'email':
        return <Mail className="h-5 w-5 text-green-500" />;
      case 'manual':
        return <Play className="h-5 w-5 text-gray-500" />;
      default:
        return <AlarmClock className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getStatusBadge = () => {
    switch (trigger.status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500 hover:bg-green-500 text-white border-0">Activ</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-400 hover:bg-gray-400 text-white border-0">Inactiv</Badge>;
      case 'error':
        return <Badge variant="destructive">Eroare</Badge>;
      default:
        return <Badge variant="outline">{trigger.status}</Badge>;
    }
  };
  
  const getTypeBadge = () => {
    switch (trigger.type) {
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
      default:
        return <Badge variant="outline">{trigger.type}</Badge>;
    }
  };
  
  return (
    <Card className="hover:border-primary/50 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getTriggerIcon()}
              <h3 className="font-medium text-lg">{trigger.name}</h3>
            </div>
            {trigger.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {trigger.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            {getTypeBadge()}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Proces asociat</p>
            <p className="text-sm">{trigger.processName}</p>
          </div>
          
          {trigger.type === 'schedule' && trigger.nextExecution && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Următoarea execuție</p>
              <p className="text-sm">{formatDate(trigger.nextExecution)}</p>
            </div>
          )}
          
          {trigger.lastTriggered && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ultima declanșare</p>
              <p className="text-sm">{formatDate(trigger.lastTriggered)}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-5 py-3 border-t flex justify-between">
        <div className="flex items-center gap-2">
          <Switch 
            checked={trigger.status === 'active'} 
            onCheckedChange={(checked) => onStatusChange(trigger.id, checked)}
          />
          <span className="text-sm text-muted-foreground">
            {trigger.status === 'active' ? 'Activ' : 'Inactiv'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => onTriggerNow(trigger.id)}
          >
            <Play className="h-4 w-4 text-primary" />
            <span className="sr-only">Declanșează acum</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => onEdit(trigger.id)}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Editează</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => onDelete(trigger.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Șterge</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TriggerCard;