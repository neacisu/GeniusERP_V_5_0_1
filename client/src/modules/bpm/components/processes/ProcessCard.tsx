/**
 * Process Card Component
 * 
 * Componentă pentru afișarea unui proces în format de card
 */

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProcessStatusBadge from './ProcessStatusBadge';
import ProcessTypeBadge from './ProcessTypeBadge';
import { Edit, Trash2, Play, Copy, GitBranch, Clock, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export interface ProcessCardProps {
  process: {
    id: string;
    name: string;
    description?: string;
    status: string;
    type: string;
    createdAt: string;
    updatedAt?: string;
    owner?: string;
    version?: string;
    executionCount?: number;
    lastExecution?: string;
    averageExecutionTime?: number;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  onViewHistory?: (id: string) => void;
}

const ProcessCard: React.FC<ProcessCardProps> = ({
  process,
  onEdit,
  onDelete,
  onRun,
  onDuplicate,
  onViewDetails,
  onViewHistory
}) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };
  
  const formatExecutionTime = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  return (
    <Card className="hover:border-primary/50 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-lg">{process.name}</h3>
              {process.version && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">v{process.version}</span>
              )}
            </div>
            {process.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {process.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <ProcessStatusBadge status={process.status} />
            <ProcessTypeBadge type={process.type} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Creat la</p>
            <p className="text-sm">{formatDate(process.createdAt)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ultima actualizare</p>
            <p className="text-sm">{formatDate(process.updatedAt)}</p>
          </div>
          
          {process.owner && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Proprietar</p>
              <p className="text-sm">{process.owner}</p>
            </div>
          )}
          
          {process.executionCount !== undefined && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Execuții</p>
              <p className="text-sm">{process.executionCount}</p>
            </div>
          )}
          
          {process.lastExecution && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ultima execuție</p>
              <p className="text-sm">{formatDate(process.lastExecution)}</p>
            </div>
          )}
          
          {process.averageExecutionTime !== undefined && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Timp mediu execuție</p>
              <p className="text-sm">{formatExecutionTime(process.averageExecutionTime)}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-5 py-3 border-t flex justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onViewDetails && onViewDetails(process.id)}
          >
            <span>Detalii</span>
          </Button>
        </div>
        <div className="flex gap-2">
          {onRun && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => onRun(process.id)}
              disabled={process.status !== 'active'}
            >
              <Play className="h-4 w-4 text-primary" />
              <span className="sr-only">Execută</span>
            </Button>
          )}
          
          {onEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => onEdit(process.id)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editează</span>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Mai multe</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewHistory && (
                <DropdownMenuItem onClick={() => onViewHistory(process.id)}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Istoric execuții</span>
                </DropdownMenuItem>
              )}
              
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(process.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Duplică</span>
                </DropdownMenuItem>
              )}
              
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(process.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Șterge</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProcessCard;