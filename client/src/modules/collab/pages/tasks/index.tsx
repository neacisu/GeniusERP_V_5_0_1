import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  CheckSquare,
  Plus,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import CollabLayout from '../../components/layout/CollabLayout';
import { TasksTable } from '../../components/tables';
import { TaskModal } from '../../components/modals';
import useCollabApi from '../../hooks/useCollabApi';
import { Task, TaskStatus } from '../../types';

/**
 * Pagina listei de sarcini
 */
const TasksPage: React.FC = () => {
  const { useTasks, useDeleteTask, useUpdateTaskStatus } = useCollabApi();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Obține lista de sarcini
  const { data: tasksData, isLoading, isError } = useTasks({
    status: statusFilter || undefined
  });
  
  // Mutația pentru ștergerea unei sarcini
  const deleteTaskMutation = useDeleteTask();
  
  // Mutația pentru actualizarea statusului unei sarcini
  const updateTaskStatusMutation = useUpdateTaskStatus();
  
  // Handler pentru editare
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsCreateModalOpen(true);
  };
  
  // Handler pentru ștergere
  const handleDelete = async (task: Task) => {
    if (window.confirm(`Sigur doriți să ștergeți sarcina "${task.title}"?`)) {
      try {
        await deleteTaskMutation.mutateAsync(task.id as string);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Eroare la ștergerea sarcinii:', error);
      }
    }
  };
  
  // Handler pentru actualizarea statusului
  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ id: taskId, status });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Eroare la actualizarea statusului sarcinii:', error);
    }
  };
  
  // Handler pentru închiderea modalului
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingTask(undefined);
  };
  
  // Handler pentru succes la editare/creare
  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Filtre disponibile
  const statusFilters = [
    { label: 'Toate sarcinile', value: null },
    ...Object.values(TaskStatus).map(status => ({
      label: status,
      value: status
    }))
  ];
  
  return (
    <CollabLayout title="Sarcini" subtitle="Gestionează și urmărește sarcinile echipei" activeTab="tasks">
      <div className="space-y-6">
        {/* Header cu acțiuni */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sarcinile mele</h1>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtre
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrează după status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusFilters.map((filter) => (
                  <DropdownMenuItem 
                    key={filter.value || 'all'} 
                    onClick={() => setStatusFilter(filter.value)}
                    className={statusFilter === filter.value ? 'bg-muted' : ''}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Sarcină nouă
            </Button>
          </div>
        </div>
        
        {/* Tabelul de sarcini */}
        <div className="border rounded-lg bg-white">
          <TasksTable 
            tasks={tasksData?.tasks || []}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </div>
        
        {/* Modalul pentru crearea/editarea unei sarcini */}
        <TaskModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
          task={editingTask}
          onSuccess={handleSuccess}
        />
      </div>
    </CollabLayout>
  );
};

export default TasksPage;