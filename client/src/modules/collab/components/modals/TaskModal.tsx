import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskForm } from '../forms';
import { Task } from '../../types';
import useCollabApi from '../../hooks/useCollabApi';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  onSuccess?: () => void;
  defaultTab?: string;
}

/**
 * Modal pentru crearea sau editarea unei sarcini
 */
const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  task, 
  onSuccess,
  defaultTab = "details"
}) => {
  const { useCreateTask, useUpdateTask } = useCollabApi();
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Mutația pentru crearea unei sarcini noi
  const createTaskMutation = useCreateTask();
  
  // Mutația pentru actualizarea unei sarcini existente
  const updateTaskMutation = useUpdateTask();
  
  // Handler pentru salvarea sau actualizarea sarcinii
  const handleSubmit = async (data: Task) => {
    try {
      if (task?.id) {
        await updateTaskMutation.mutateAsync(data);
      } else {
        await createTaskMutation.mutateAsync(data);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Eroare la salvarea sarcinii:', error);
    }
  };
  
  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task?.id ? 'Editare sarcină' : 'Sarcină nouă'}</DialogTitle>
          <DialogDescription>
            {task?.id 
              ? 'Modificați detaliile sarcinii existente.'
              : 'Creați o sarcină nouă și atribuiți-o membrilor echipei.'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Detalii</TabsTrigger>
            <TabsTrigger value="comments" disabled={!task?.id}>Comentarii</TabsTrigger>
            <TabsTrigger value="activity" disabled={!task?.id}>Activitate</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pt-4">
            <TaskForm 
              task={task} 
              onSubmit={handleSubmit} 
              onCancel={onClose}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="comments" className="pt-4">
            {task?.id ? (
              <div className="text-muted-foreground text-center py-8">
                <p>Funcționalitatea de comentarii va fi implementată în versiunile următoare.</p>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                <p>Salvați sarcina pentru a putea adăuga comentarii.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="activity" className="pt-4">
            {task?.id ? (
              <div className="text-muted-foreground text-center py-8">
                <p>Istoricul activităților va fi implementat în versiunile următoare.</p>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                <p>Salvați sarcina pentru a vedea istoricul activităților.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;