import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  FileText,
  Plus,
  Filter,
  Pin,
  Tag as TagIcon
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import CollabLayout from '../../components/layout/CollabLayout';
import { NotesTable } from '../../components/tables';
import { NoteModal, ConfirmationModal } from '../../components/modals';
import useCollabApi from '../../hooks/useCollabApi';
import { Note } from '../../types';

/**
 * Pagina listei de notițe
 */
const NotesPage: React.FC = () => {
  const { useNotes, useDeleteNote, useToggleNotePin, useNoteTags } = useCollabApi();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | undefined>();
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Obține lista de notițe
  const { data: notesData, isLoading, isError } = useNotes({
    taskId: undefined, // Filter by task if needed
    search: undefined
  });
  
  // Obține taguri populare
  const { data: tagsData } = useNoteTags();
  const popularTags = tagsData?.tags || [];
  
  // Mutația pentru ștergerea unei notițe
  const deleteNoteMutation = useDeleteNote();
  
  // Mutația pentru fixarea/anularea fixării unei notițe
  const togglePinMutation = useToggleNotePin();
  
  // Handler pentru editare
  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsCreateModalOpen(true);
  };
  
  // Handler pentru inițierea ștergerii
  const handleDeleteInit = (note: Note) => {
    setNoteToDelete(note);
    setIsConfirmDeleteOpen(true);
  };
  
  // Handler pentru confirmarea ștergerii
  const handleConfirmDelete = async () => {
    if (noteToDelete?.id) {
      try {
        await deleteNoteMutation.mutateAsync(noteToDelete.id);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Eroare la ștergerea notiței:', error);
      }
      setIsConfirmDeleteOpen(false);
      setNoteToDelete(undefined);
    }
  };
  
  // Handler pentru fixare/anulare fixare
  const handleTogglePin = async (noteId: string, isPinned: boolean) => {
    try {
      await togglePinMutation.mutateAsync({ id: noteId, isPinned });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Eroare la modificarea stării de fixare:', error);
    }
  };
  
  // Handler pentru închiderea modalului
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingNote(undefined);
  };
  
  // Handler pentru succes la editare/creare
  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handler pentru filtrare după tag
  const handleTagFilter = (tag: string | null) => {
    setTagFilter(tag);
  };
  
  return (
    <CollabLayout title="Notițe" subtitle="Gestionați notițele și documentația internă" activeTab="notes">
      <div className="space-y-6">
        {/* Header cu acțiuni */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Notițele mele</h1>
          
          <div className="flex gap-2">
            <Input
              placeholder="Caută notițe..."
              className="max-w-sm"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <TagIcon className="h-4 w-4 mr-2" />
                  Filtrează după tag
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrează după tag</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleTagFilter(null)}
                  className={tagFilter === null ? 'bg-muted' : ''}
                >
                  Toate notițele
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(popularTags || []).map((tag) => (
                  <DropdownMenuItem 
                    key={tag} 
                    onClick={() => handleTagFilter(tag)}
                    className={tagFilter === tag ? 'bg-muted' : ''}
                  >
                    <TagIcon className="h-3 w-3 mr-2" />
                    {tag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Notiță nouă
            </Button>
          </div>
        </div>
        
        {/* Taguri active */}
        {tagFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrat după:</span>
            <Badge 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={() => handleTagFilter(null)}
            >
              <TagIcon className="h-3 w-3" />
              {tagFilter}
              <span className="ml-1 cursor-pointer">&times;</span>
            </Badge>
          </div>
        )}
        
        {/* Tabelul de notițe */}
        <div className="border rounded-lg bg-white">
          <NotesTable 
            notes={notesData?.notes || []}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteInit}
            onTogglePin={handleTogglePin}
          />
        </div>
        
        {/* Modaluri */}
        <NoteModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
          note={editingNote}
          onSuccess={handleSuccess}
        />
        
        <ConfirmationModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Șterge notița"
          description={`Sigur doriți să ștergeți notița "${noteToDelete?.title}"? Această acțiune nu poate fi anulată.`}
          confirmLabel="Șterge"
          cancelLabel="Anulează"
          variant="destructive"
          isLoading={deleteNoteMutation.isPending}
        />
      </div>
    </CollabLayout>
  );
};

export default NotesPage;