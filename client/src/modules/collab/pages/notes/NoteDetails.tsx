import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import {
  ArrowLeft,
  FileText,
  Tag as TagIcon,
  Edit2,
  AlertTriangle,
  Calendar,
  Users,
  Clock,
  LinkIcon,
  Link,
  Paperclip,
  Pin,
  Eye,
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import CollabLayout from '../../components/layout/CollabLayout';
import { NoteModal } from '../../components/modals';
import useCollabApi from '../../hooks/useCollabApi';
import { Note } from '../../types';

/**
 * Pagina de detalii a unei notițe
 */
const NoteDetailsPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/collab/notes/:id');
  const collabApi = useCollabApi();
  
  // TODO: Implementare hook-uri pentru note individual și istoric
  // Deocamdată stubuite pentru a evita erorile TypeScript
  const useNote = (id?: string): { data: Note | null; isLoading: boolean; isError: boolean } => ({ data: null, isLoading: false, isError: false });
  const useNoteHistory = (id?: string) => ({ data: { items: [] }, isLoading: false });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewNote, setIsNewNote] = useState(false);
  
  const noteId = params?.id;
  
  // Verificăm dacă este o notiță nouă sau un id existent
  useEffect(() => {
    if (noteId === 'new') {
      setIsNewNote(true);
      setIsEditModalOpen(true);
    }
  }, [noteId]);
  
  // Obține detaliile notiței
  const { data: note, isLoading, isError } = useNote(noteId !== 'new' ? noteId : undefined);
  
  // Obține istoricul notiței
  const { data: history, isLoading: isLoadingHistory } = useNoteHistory(noteId !== 'new' ? noteId : undefined);
  
  // Handler pentru închiderea modalului
  const handleCloseModal = () => {
    if (isNewNote) {
      navigate('/collab/notes');
    } else {
      setIsEditModalOpen(false);
    }
  };
  
  // Handler pentru succes la editare/creare
  const handleSuccess = () => {
    if (isNewNote) {
      // Pentru notă nouă, nu avem updatedNote disponibil din NoteModal
      // NoteModal va trebui să redirecționeze sau să apeleze această funcție după creare
      setIsEditModalOpen(false);
    } else {
      setIsEditModalOpen(false);
      // Aici ar veni reîncărcarea datelor
    }
  };
  
  // Transformă conținutul markdown în HTML (aici e simplificat, în producție ar folosi o bibliotecă dedicată)
  const renderMarkdown = (content?: string) => {
    if (!content) return <p className="text-muted-foreground">Fără conținut</p>;
    
    // Aici ar fi folosit în producție o bibliotecă precum marked sau remark
    // Pentru simplitate, afișăm conținutul fără formatare
    return <pre className="whitespace-pre-wrap">{content}</pre>;
  };
  
  // Dacă se încarcă și nu este o notiță nouă
  if (isLoading && !isNewNote) {
    return (
      <CollabLayout title="Detalii notiță" subtitle="Se încarcă..." activeTab="notes">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </CollabLayout>
    );
  }
  
  // Dacă există o eroare și nu este o notiță nouă
  if (isError && !isNewNote) {
    return (
      <CollabLayout title="Eroare" subtitle="Notița nu a putut fi încărcată" activeTab="notes">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Notița nu a putut fi găsită</h2>
              <p className="text-muted-foreground mb-4">
                Notița cu ID-ul {noteId} nu există sau nu aveți permisiunile necesare.
              </p>
              <Button onClick={() => navigate('/collab/notes')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi la lista de notițe
              </Button>
            </div>
          </CardContent>
        </Card>
      </CollabLayout>
    );
  }
  
  // Dacă este o notiță nouă, afișăm doar modal-ul
  if (isNewNote) {
    return (
      <CollabLayout title="Notiță nouă" subtitle="Creați o notiță nouă" activeTab="notes">
        <NoteModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      </CollabLayout>
    );
  }
  
  return (
    <CollabLayout 
      title={(note as any)?.title || 'Detalii notiță'} 
      subtitle="Vizualizați și gestionați notița" 
      activeTab="notes"
    >
      <div className="space-y-6">
        {/* Butoane acțiuni */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/collab/notes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la lista de notițe
          </Button>
          
          <div className="flex gap-2">
            {note?.isPinned && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Fixat
              </Badge>
            )}
            {(note as any)?.isPublic && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Public
              </Badge>
            )}
            <Button onClick={() => setIsEditModalOpen(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editează notița
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Conținut notiță */}
          <div className="md:col-span-3 space-y-6">
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Conținut
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Previzualizare
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Activitate
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{(note as any)?.title}</CardTitle>
                        <CardDescription>Creat de {(note as any)?.createdBy || 'Sistem'}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap p-4 bg-muted rounded-lg border">
                          {note?.content || 'Fără conținut'}
                        </pre>
                      </div>
                      
                      {note?.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {note.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline">
                              <TagIcon className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{(note as any)?.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="prose max-w-none">
                        {renderMarkdown(note?.content)}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Istoricul modificărilor</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-muted"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded w-1/2"></div>
                              <div className="h-3 bg-muted rounded w-1/4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : history?.items && history.items.length > 0 ? (
                      <div className="space-y-4">
                        {history.items.map((activity: { id: string; description: string; timestamp: string }) => (
                          <div key={activity.id} className="flex gap-4">
                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted">
                              <Clock className="h-4 w-4" />
                            </div>
                            <div>
                              <p>{activity.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">Nicio activitate</h3>
                        <p className="text-muted-foreground">
                          Nu există înregistrări de activitate pentru această notiță.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Elemente asociate */}
            {(note as any)?.relatedItems && Array.isArray((note as any).relatedItems) && (note as any).relatedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Elemente asociate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {((note as any).relatedItems as any[]).map((item: { type: string; title?: string; id: string }, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        {item.type === 'task' ? (
                          <FileText className="h-4 w-4 text-blue-500" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-indigo-500" />
                        )}
                        <Link 
                          href={item.type === 'task' ? `/collab/tasks/${item.id}` : `/collab/threads/${item.id}`}
                          className="text-primary hover:underline"
                        >
                          {item.title || `${item.type === 'task' ? 'Sarcina' : 'Discuția'} #${item.id}`}
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar detalii */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalii notiță</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vizibilitate */}
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vizibilitate</p>
                    <p className="font-medium">{(note as any)?.isPublic ? 'Publică' : 'Privată'}</p>
                  </div>
                </div>
                
                {/* Status fixare */}
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{note?.isPinned ? 'Fixat' : 'Normal'}</p>
                  </div>
                </div>
                
                {/* Atașamente */}
                {(note as any)?.attachmentCount !== undefined && (note as any).attachmentCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Atașamente</p>
                      <p className="font-medium">{(note as any).attachmentCount}</p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* Creat de */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Creat de</p>
                    <p className="font-medium">{(note as any)?.createdBy || 'Sistem'}</p>
                  </div>
                </div>
                
                {/* Data creării */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Creat la</p>
                    <p className="font-medium">
                      {note?.createdAt ? new Date(note.createdAt).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
                
                {/* Ultima actualizare */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Actualizat la</p>
                    <p className="font-medium">
                      {note?.updatedAt ? new Date(note.updatedAt).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acțiuni rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Adaugă atașament
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Asociază cu alte elemente
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Pin className="h-4 w-4 mr-2" />
                  {note?.isPinned ? 'Anulează fixare' : 'Fixează notița'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modal pentru editare */}
      <NoteModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        note={note || undefined}
        onSuccess={handleSuccess}
      />
    </CollabLayout>
  );
};

export default NoteDetailsPage;