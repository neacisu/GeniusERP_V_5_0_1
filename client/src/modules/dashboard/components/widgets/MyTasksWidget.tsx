/**
 * My Tasks Widget
 * 
 * This dashboard widget displays the user's tasks with filtering options
 * for priority and status, and allows quick status updates.
 */

import React, { useState } from 'react';
import useCollabApi from '@/modules/collab/hooks/useCollabApi';
import { Task, TaskStatus, TaskPriority } from '@/modules/collab/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { 
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarDays,
  ClipboardList,
  ArrowUpRight,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MyTasksWidgetProps {
  userId: string;
  limit?: number;
}

const priorityIcons = {
  [TaskPriority.LOW]: null,
  [TaskPriority.NORMAL]: null,
  [TaskPriority.HIGH]: <AlertCircle className="h-3 w-3 text-yellow-500" />,
  [TaskPriority.CRITICAL]: <AlertCircle className="h-3 w-3 text-red-500" />
};

const statusColors = {
  [TaskStatus.PENDING]: 'bg-gray-100 text-gray-700',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-700',
  [TaskStatus.REVIEW]: 'bg-amber-100 text-amber-700',
  [TaskStatus.BLOCKED]: 'bg-red-100 text-red-700',
  [TaskStatus.DEFERRED]: 'bg-purple-100 text-purple-700',
  [TaskStatus.CANCELLED]: 'bg-gray-100 text-gray-700'
};

const formatDueDate = (dueDate: Date) => {
  if (isToday(dueDate)) {
    return 'Astăzi';
  } else if (isTomorrow(dueDate)) {
    return 'Mâine';
  } else if (isThisWeek(dueDate)) {
    return format(dueDate, 'EEEE', { locale: ro });
  } else {
    return format(dueDate, 'd MMM', { locale: ro });
  }
};

export default function MyTasksWidget({ userId, limit = 6 }: MyTasksWidgetProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'today'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();
  
  const { useTasks, useUpdateTaskStatus } = useCollabApi();
  
  // Fetch user's tasks
  const { data: tasksData, isLoading, error, refetch: originalRefetch } = useTasks({
    assignedTo: userId,
    limit: limit,
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });
  
  // Custom refetch function that updates the last updated timestamp
  const refetch = async () => {
    const result = await originalRefetch();
    setLastUpdated(new Date());
    toast({
      title: "Actualizare efectuată",
      description: "Lista de sarcini a fost actualizată cu succes.",
      variant: "default",
    });
    return result;
  };
  
  // Handle the case when we might receive an error response with items
  const taskResponseData = tasksData && typeof tasksData === 'object' && 'error' in tasksData && 'items' in tasksData
    ? { tasks: Array.isArray(tasksData.items) ? tasksData.items : [] }
    : tasksData;
  
  const updateTaskStatusMutation = useUpdateTaskStatus();
  
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatusMutation.mutateAsync({
        id: taskId,
        status: newStatus
      });
      
      toast({
        title: 'Status actualizat',
        description: 'Statusul sarcinii a fost actualizat cu succes.',
        variant: 'default'
      });
      
      refetch();
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza statusul sarcinii.',
        variant: 'destructive'
      });
    }
  };
  
  // Filter tasks based on the selected filter
  const filterTasks = (tasks: Task[]) => {
    if (!tasks) return [];
    
    // First apply status filter
    let filteredTasks = [...tasks];
    
    if (filter === 'pending') {
      filteredTasks = filteredTasks.filter(task => 
        task.status === TaskStatus.PENDING || 
        task.status === TaskStatus.IN_PROGRESS
      );
    } else if (filter === 'overdue') {
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate && isPast(new Date(task.dueDate)) && 
        task.status !== TaskStatus.COMPLETED
      );
    } else if (filter === 'today') {
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate && isToday(new Date(task.dueDate))
      );
    }
    
    // Then apply priority filter
    if (priorityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => 
        task.priority === priorityFilter
      );
    }
    
    return filteredTasks;
  };
  
  const filteredTasks = taskResponseData ? filterTasks(taskResponseData.tasks || []) : [];
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">Sarcinile Mele</CardTitle>
            <CardDescription>
              {isLoading ? 'Se încarcă...' : `${filteredTasks.length} sarcini`}
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/collab/tasks">
                    <ClipboardList className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Vezi Toate</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vezi toate sarcinile</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <div className="px-4 pb-2">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
          <Tabs defaultValue="all" value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">Toate</TabsTrigger>
              <TabsTrigger value="pending">Active</TabsTrigger>
              <TabsTrigger value="overdue" className="text-red-500">Întârziate</TabsTrigger>
              <TabsTrigger value="today">Azi</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Toate prioritățile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate prioritățile</SelectItem>
              <SelectItem value={TaskPriority.CRITICAL}>Critică</SelectItem>
              <SelectItem value={TaskPriority.HIGH}>Ridicată</SelectItem>
              <SelectItem value={TaskPriority.NORMAL}>Normală</SelectItem>
              <SelectItem value={TaskPriority.LOW}>Scăzută</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Nu s-au putut încărca sarcinile.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Încearcă din nou
            </Button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nu există sarcini care să corespundă filtrelor.</p>
          </div>
        ) : (
          <ScrollArea className="h-[260px] pr-4">
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-start gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1">
                      {priorityIcons[task.priority as keyof typeof priorityIcons] && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {priorityIcons[task.priority as keyof typeof priorityIcons]}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {task.priority === TaskPriority.CRITICAL ? 'Prioritate critică' :
                                 task.priority === TaskPriority.HIGH ? 'Prioritate ridicată' : 
                                 task.priority === TaskPriority.NORMAL ? 'Prioritate normală' :
                                 task.priority === TaskPriority.LOW ? 'Prioritate scăzută' : ''}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Link 
                        href={`/collab/tasks/${task.id}`}
                        className="font-medium text-sm hover:text-primary hover:underline truncate"
                      >
                        {task.title}
                      </Link>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Badge variant="outline" className={cn("text-xs py-0 px-1", statusColors[task.status as TaskStatus] || 'bg-gray-100 text-gray-700')}>
                        {task.status === TaskStatus.PENDING ? 'De făcut' :
                         task.status === TaskStatus.IN_PROGRESS ? 'În lucru' :
                         task.status === TaskStatus.COMPLETED ? 'Finalizat' :
                         task.status === TaskStatus.REVIEW ? 'În verificare' :
                         task.status === TaskStatus.CANCELLED ? 'Anulat' : 
                         task.status}
                      </Badge>
                      
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span 
                            className={cn(
                              task.status !== TaskStatus.COMPLETED && 
                              task.dueDate && 
                              isPast(new Date(task.dueDate)) ? 
                              'text-red-500 font-medium' : ''
                            )}
                          >
                            {formatDueDate(new Date(task.dueDate))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {task.status !== TaskStatus.COMPLETED ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleStatusChange(task.id, TaskStatus.COMPLETED)}
                              disabled={updateTaskStatusMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Marchează ca finalizat</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/collab/tasks/${task.id}`}>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Vezi detalii</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2 pt-1">
        <div className="w-full text-xs text-gray-500 text-right italic">
          Ultima actualizare la: {format(lastUpdated, 'dd.MM.yyyy HH:mm', { locale: ro })}
        </div>
        <div className="w-full flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                <span>Se încarcă...</span>
              </>
            ) : (
              <span>Actualizează</span>
            )}
          </Button>
          
          <Link href="/collab/tasks/new">
            <Button variant="default" size="sm">
              <span className="material-icons text-sm mr-1">add</span>
              Sarcină Nouă
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}