import React from 'react';
import { Link } from 'wouter';
import { 
  Clock, 
  Calendar, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  FileClock, 
  Circle, 
  ArrowUpCircle 
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import { Task, TaskStatus, TaskPriority } from '../../types';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  className?: string;
}

/**
 * Componentă card pentru afișarea unei sarcini
 * Folosită în listele de sarcini, panouri Kanban și dashboard-uri
 */
const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, className = '' }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(task);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-slate-500/20 text-slate-700 border-slate-300';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-500/20 text-blue-700 border-blue-300';
      case TaskStatus.REVIEW:
        return 'bg-purple-500/20 text-purple-700 border-purple-300';
      case TaskStatus.COMPLETED:
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-300';
      case TaskStatus.BLOCKED:
        return 'bg-red-500/20 text-red-700 border-red-300';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-300';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-slate-100 text-slate-700';
      case TaskPriority.NORMAL:
        return 'bg-blue-100 text-blue-700';
      case TaskPriority.HIGH:
        return 'bg-amber-100 text-amber-700';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return <Circle className="h-4 w-4" />;
      case TaskStatus.IN_PROGRESS:
        return <FileClock className="h-4 w-4" />;
      case TaskStatus.REVIEW:
        return <Users className="h-4 w-4" />;
      case TaskStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case TaskStatus.BLOCKED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return null;
      case TaskPriority.NORMAL:
        return null;
      case TaskPriority.HIGH:
        return <ArrowUpCircle className="h-3 w-3" />;
      case TaskPriority.URGENT:
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Calculează zilele rămase până la deadline
  const getDaysRemaining = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  return (
    <Card
      className={`hover:border-primary transition-all cursor-pointer ${className} ${
        task.priority === TaskPriority.URGENT ? 'border-l-4 border-l-red-500' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/collab/tasks/${task.id}`} className="text-base font-medium hover:text-primary hover:underline">
              {task.title}
            </Link>
            
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {task.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge className={getStatusColor(task.status)}>
            {getStatusIcon(task.status)}
            <span className="ml-1">{task.status}</span>
          </Badge>
          
          {task.priority !== TaskPriority.NORMAL && (
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {getPriorityIcon(task.priority)}
              <span className={getPriorityIcon(task.priority) ? "ml-1" : ""}>
                {task.priority}
              </span>
            </Badge>
          )}
        </div>
        
        {task.progress !== undefined && task.progress > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Progres</span>
              <span>{task.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="flex items-center">
            {task.assignedTo ? (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {task.assignedTo?.substring(0, 2).toUpperCase() || 'UN'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Badge variant="outline" className="h-6 rounded-full text-xs px-2 border-dashed">
                Neatribuit
              </Badge>
            )}
          </div>
          
          {task.dueDate && (
            <div className={`flex items-center ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                {isOverdue 
                  ? `Întârziat cu ${Math.abs(daysRemaining!)} zile` 
                  : daysRemaining === 0 
                    ? 'Astăzi' 
                    : daysRemaining === 1 
                      ? 'Mâine' 
                      : `În ${daysRemaining} zile`}
              </span>
            </div>
          )}
          
          {task.commentCount !== undefined && task.commentCount > 0 && (
            <div className="flex items-center text-muted-foreground ml-2">
              <Users className="h-3 w-3 mr-1" />
              <span>{task.commentCount}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;