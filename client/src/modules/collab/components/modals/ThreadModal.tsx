import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThreadForm } from '../forms';
import { Thread } from '../../types';
import useCollabApi from '../../hooks/useCollabApi';

interface ThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread?: Thread;
  onSuccess?: () => void;
  defaultTab?: string;
  isCommunityThread?: boolean;
}

/**
 * Modal pentru crearea sau editarea unei discuții
 */
const ThreadModal: React.FC<ThreadModalProps> = ({ 
  isOpen, 
  onClose, 
  thread, 
  onSuccess,
  defaultTab = "details",
  isCommunityThread = false
}) => {
  const { useCreateThread, useUpdateThread } = useCollabApi();
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Mutația pentru crearea unei discuții noi
  const createThreadMutation = useCreateThread();
  
  // Mutația pentru actualizarea unei discuții existente
  const updateThreadMutation = useUpdateThread();
  
  // Handler pentru salvarea sau actualizarea discuției
  const handleSubmit = async (data: Thread) => {
    try {
      if (thread?.id) {
        await updateThreadMutation.mutateAsync(data);
      } else {
        await createThreadMutation.mutateAsync(data);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Eroare la salvarea discuției:', error);
    }
  };
  
  const isLoading = createThreadMutation.isPending || updateThreadMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {thread?.id 
              ? `Editare ${isCommunityThread ? 'postare' : 'discuție'}`
              : `${isCommunityThread ? 'Postare' : 'Discuție'} nouă`}
          </DialogTitle>
          <DialogDescription>
            {thread?.id 
              ? `Modificați detaliile ${isCommunityThread ? 'postării' : 'discuției'} existente.`
              : `Creați o ${isCommunityThread ? 'postare' : 'discuție'} nouă și invitați participanți.`}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Detalii</TabsTrigger>
            <TabsTrigger value="messages" disabled={!thread?.id}>Mesaje</TabsTrigger>
            <TabsTrigger value="participants" disabled={!thread?.id || isCommunityThread}>Participanți</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pt-4">
            <ThreadForm 
              thread={thread} 
              onSubmit={handleSubmit}
              onCancel={onClose}
              isLoading={isLoading}
              isCommunityThread={isCommunityThread}
            />
          </TabsContent>
          
          <TabsContent value="messages" className="pt-4">
            {thread?.id ? (
              <div className="text-muted-foreground text-center py-8">
                <p>Funcționalitatea de mesaje va fi implementată în versiunile următoare.</p>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                <p>Salvați discuția pentru a putea adăuga mesaje.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="participants" className="pt-4">
            {(thread?.id && !isCommunityThread) ? (
              <div className="text-muted-foreground text-center py-8">
                <p>Managementul participanților va fi implementat în versiunile următoare.</p>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                <p>Salvați discuția pentru a gestiona participanții.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ThreadModal;