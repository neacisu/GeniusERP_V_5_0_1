import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NoteForm } from '../forms';
import { Note } from '../../types';
import useCollabApi from '../../hooks/useCollabApi';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note?: Note;
  onSuccess?: () => void;
  defaultTab?: string;
  relatedTaskId?: string;
  relatedThreadId?: string;
}

/**
 * Modal pentru crearea sau editarea unei notițe
 */
const NoteModal: React.FC<NoteModalProps> = ({ 
  isOpen, 
  onClose, 
  note, 
  onSuccess,
  defaultTab = "details",
  relatedTaskId,
  relatedThreadId
}) => {
  const { useCreateNote, useUpdateNote } = useCollabApi();
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Mutația pentru crearea unei notițe noi
  const createNoteMutation = useCreateNote();
  
  // Mutația pentru actualizarea unei notițe existente
  const updateNoteMutation = useUpdateNote();
  
  // Handler pentru salvarea sau actualizarea notiței
  const handleSubmit = async (data: Note) => {
    try {
      if (note?.id) {
        await updateNoteMutation.mutateAsync(data);
      } else {
        await createNoteMutation.mutateAsync(data);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Eroare la salvarea notiței:', error);
    }
  };
  
  const isLoading = createNoteMutation.isPending || updateNoteMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note?.id ? 'Editare notiță' : 'Notiță nouă'}</DialogTitle>
          <DialogDescription>
            {note?.id 
              ? 'Modificați conținutul notiței existente.'
              : 'Creați o notiță nouă pentru a documenta informații importante.'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Conținut</TabsTrigger>
            <TabsTrigger value="preview" disabled={!note?.content}>Previzualizare</TabsTrigger>
            <TabsTrigger value="relations" disabled={!note?.id}>Relații</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pt-4">
            <NoteForm 
              note={note} 
              onSubmit={handleSubmit} 
              onCancel={onClose}
              isLoading={isLoading}
              relatedTaskId={relatedTaskId}
              relatedThreadId={relatedThreadId}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="pt-4">
            {(note?.content) ? (
              <div className="prose max-w-none">
                {/* Aici ar veni renderul conținutului markdown */}
                <div className="text-muted-foreground text-center py-8">
                  <p>Renderul conținutului markdown va fi implementat în versiunile următoare.</p>
                  <pre className="mt-4 bg-muted p-4 rounded-md overflow-auto">
                    {note.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                <p>Adăugați conținut pentru a putea previzualiza.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="relations" className="pt-4">
            {note?.id ? (
              <div className="text-muted-foreground text-center py-8">
                <p>Managementul relațiilor va fi implementat în versiunile următoare.</p>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                <p>Salvați notița pentru a gestiona relațiile cu alte elemente.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NoteModal;