import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  MessageSquare,
  Plus,
  Filter,
  Pin
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
import { ThreadsTable } from '../../components/tables';
import { ThreadModal, ConfirmationModal } from '../../components/modals';
import useCollabApi from '../../hooks/useCollabApi';
import { Thread } from '../../types';

/**
 * Pagina listei de discuții
 */
const ThreadsPage: React.FC = () => {
  const { useThreads, useDeleteThread, useToggleThreadPin } = useCollabApi();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingThread, setEditingThread] = useState<Thread | undefined>();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<Thread | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Obține lista de discuții
  const { data: threadsData, isLoading, isError } = useThreads({
    refresh: refreshTrigger
  });
  
  // Mutația pentru ștergerea unei discuții
  const deleteThreadMutation = useDeleteThread();
  
  // Mutația pentru fixarea/anularea fixării unei discuții
  const togglePinMutation = useToggleThreadPin();
  
  // Handler pentru editare
  const handleEdit = (thread: Thread) => {
    setEditingThread(thread);
    setIsCreateModalOpen(true);
  };
  
  // Handler pentru inițierea ștergerii
  const handleDeleteInit = (thread: Thread) => {
    setThreadToDelete(thread);
    setIsConfirmDeleteOpen(true);
  };
  
  // Handler pentru confirmarea ștergerii
  const handleConfirmDelete = async () => {
    if (threadToDelete?.id) {
      try {
        await deleteThreadMutation.mutateAsync(threadToDelete.id);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Eroare la ștergerea discuției:', error);
      }
      setIsConfirmDeleteOpen(false);
      setThreadToDelete(undefined);
    }
  };
  
  // Handler pentru fixare/anulare fixare
  const handleTogglePin = async (threadId: string, isPinned: boolean) => {
    try {
      await togglePinMutation.mutateAsync({ id: threadId, isPinned });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Eroare la modificarea stării de fixare:', error);
    }
  };
  
  // Handler pentru închiderea modalului
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingThread(undefined);
  };
  
  // Handler pentru succes la editare/creare
  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <CollabLayout title="Discuții" subtitle="Conversații și schimb de informații cu echipa" activeTab="threads">
      <div className="space-y-6">
        {/* Header cu acțiuni */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Discuțiile mele</h1>
          
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Discuție nouă
          </Button>
        </div>
        
        {/* Tabelul de discuții */}
        <div className="border rounded-lg bg-white">
          <ThreadsTable 
            threads={threadsData?.threads || []}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteInit}
            onTogglePin={handleTogglePin}
          />
        </div>
        
        {/* Modaluri */}
        <ThreadModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
          thread={editingThread}
          onSuccess={handleSuccess}
        />
        
        <ConfirmationModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Șterge discuția"
          description={`Sigur doriți să ștergeți discuția "${threadToDelete?.title}"? Această acțiune nu poate fi anulată.`}
          confirmLabel="Șterge"
          cancelLabel="Anulează"
          variant="destructive"
          isLoading={deleteThreadMutation.isPending}
        />
      </div>
    </CollabLayout>
  );
};

export default ThreadsPage;