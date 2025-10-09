import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import {
  ArrowLeft,
  MessageSquare,
  Users,
  Calendar,
  Send,
  Pin,
  Edit2,
  AlertTriangle,
  Clock,
  Tag
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import CollabLayout from '../../components/layout/CollabLayout';
import { ThreadModal } from '../../components/modals';
import useCollabApi from '../../hooks/useCollabApi';
import { Thread } from '../../types';

/**
 * Pagina de detalii a unei discuții
 */
const ThreadDetailsPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [matchThreads, paramsThreads] = useRoute('/collab/threads/:id');
  const [matchAnnouncements, paramsAnnouncements] = useRoute('/collab/community/announcements/:id');
  const [matchAnnouncementsUpper, paramsAnnouncementsUpper] = useRoute('/collab/community/ANUNTURI/:id');
  const [matchQuestions, paramsQuestions] = useRoute('/collab/community/questions/:id');
  const [matchQuestionsUpper, paramsQuestionsUpper] = useRoute('/collab/community/INTREBARI/:id');
  const [matchIdeas, paramsIdeas] = useRoute('/collab/community/ideas/:id');
  const [matchIdeasUpper, paramsIdeasUpper] = useRoute('/collab/community/IDEI/:id');
  const [matchEvents, paramsEvents] = useRoute('/collab/community/events/:id');
  const [matchEventsUpper, paramsEventsUpper] = useRoute('/collab/community/EVENIMENTE/:id');
  const [matchResources, paramsResources] = useRoute('/collab/community/resources/:id');
  const [matchResourcesUpper, paramsResourcesUpper] = useRoute('/collab/community/RESURSE/:id');
  const [matchTutorials, paramsTutorials] = useRoute('/collab/community/tutorials/:id');
  const [matchTutorialsUpper, paramsTutorialsUpper] = useRoute('/collab/community/TUTORIALE/:id');
  
  const { useThread, useThreadMessages, useSendMessage } = useCollabApi();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewThread, setIsNewThread] = useState(false);
  const [message, setMessage] = useState('');
  
  // Get the thread ID from any of the matched routes
  const threadId = paramsThreads?.id || 
                  paramsAnnouncements?.id || paramsAnnouncementsUpper?.id ||
                  paramsQuestions?.id || paramsQuestionsUpper?.id ||
                  paramsIdeas?.id || paramsIdeasUpper?.id ||
                  paramsEvents?.id || paramsEventsUpper?.id ||
                  paramsResources?.id || paramsResourcesUpper?.id ||
                  paramsTutorials?.id || paramsTutorialsUpper?.id;
  
  // Verificăm dacă este o discuție nouă sau un id existent
  useEffect(() => {
    if (threadId === 'new') {
      setIsNewThread(true);
      setIsEditModalOpen(true);
    }
  }, [threadId]);
  
  // Obține detaliile discuției
  const { data: thread, isLoading, isError } = useThread(threadId !== 'new' ? threadId : undefined);
  
  // Obține mesajele discuției
  const { data: messages, isLoading: isLoadingMessages } = useThreadMessages(threadId !== 'new' ? threadId : undefined);
  
  // Mutația pentru trimiterea unui mesaj
  const sendMessageMutation = useSendMessage();
  
  // Handler pentru închiderea modalului
  const handleCloseModal = () => {
    if (isNewThread) {
      navigate('/collab/threads');
    } else {
      setIsEditModalOpen(false);
    }
  };
  
  // Handler pentru succes la editare/creare
  const handleSuccess = (updatedThread: Thread) => {
    if (isNewThread) {
      navigate(`/collab/threads/${updatedThread.id}`);
    } else {
      setIsEditModalOpen(false);
      // Aici ar veni reîncărcarea datelor
    }
  };
  
  // Handler pentru trimiterea unui mesaj nou
  const handleSendMessage = async () => {
    if (message.trim() && threadId !== 'new') {
      try {
        await sendMessageMutation.mutateAsync({
          threadId,
          content: message
        });
        setMessage('');
        // Aici ar veni reîncărcarea mesajelor
      } catch (error) {
        console.error('Eroare la trimiterea mesajului:', error);
      }
    }
  };
  
  // Dacă se încarcă și nu este o discuție nouă
  if (isLoading && !isNewThread) {
    return (
      <CollabLayout title="Detalii discuție" subtitle="Se încarcă..." activeTab="threads">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </CollabLayout>
    );
  }
  
  // Dacă există o eroare și nu este o discuție nouă
  if (isError && !isNewThread) {
    return (
      <CollabLayout title="Eroare" subtitle="Discuția nu a putut fi încărcată" activeTab="threads">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Discuția nu a putut fi găsită</h2>
              <p className="text-muted-foreground mb-4">
                Discuția cu ID-ul {threadId} nu există sau nu aveți permisiunile necesare.
              </p>
              <Button onClick={() => {
                // Determine which page to navigate back to based on the matching route
                if (matchThreads) {
                  navigate('/collab/threads');
                } else if (matchAnnouncements || matchAnnouncementsUpper) {
                  navigate('/collab/community/announcements');
                } else if (matchQuestions || matchQuestionsUpper) {
                  navigate('/collab/community/questions');
                } else if (matchIdeas || matchIdeasUpper) {
                  navigate('/collab/community/ideas');
                } else if (matchEvents || matchEventsUpper) {
                  navigate('/collab/community/events');
                } else if (matchResources || matchResourcesUpper) {
                  navigate('/collab/community/resources');
                } else if (matchTutorials || matchTutorialsUpper) {
                  navigate('/collab/community/tutorials');
                } else {
                  navigate('/collab/community');
                }
              }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi la lista de discuții
              </Button>
            </div>
          </CardContent>
        </Card>
      </CollabLayout>
    );
  }
  
  // Dacă este o discuție nouă, afișăm doar modal-ul
  if (isNewThread) {
    return (
      <CollabLayout title="Discuție nouă" subtitle="Creați o discuție nouă" activeTab="threads">
        <ThreadModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      </CollabLayout>
    );
  }
  
  return (
    <CollabLayout 
      title={thread?.title || 'Detalii discuție'} 
      subtitle="Conversație și schimb de mesaje" 
      activeTab="threads"
    >
      <div className="space-y-6">
        {/* Butoane acțiuni */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => {
            // Determine which page to navigate back to based on the matching route
            if (matchThreads) {
              navigate('/collab/threads');
            } else if (matchAnnouncements || matchAnnouncementsUpper) {
              navigate('/collab/community/announcements');
            } else if (matchQuestions || matchQuestionsUpper) {
              navigate('/collab/community/questions');
            } else if (matchIdeas || matchIdeasUpper) {
              navigate('/collab/community/ideas');
            } else if (matchEvents || matchEventsUpper) {
              navigate('/collab/community/events');
            } else if (matchResources || matchResourcesUpper) {
              navigate('/collab/community/resources');
            } else if (matchTutorials || matchTutorialsUpper) {
              navigate('/collab/community/tutorials');
            } else {
              navigate('/collab/community');
            }
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la lista de discuții
          </Button>
          
          <div className="flex gap-2">
            {thread?.isPinned && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Fixat
              </Badge>
            )}
            <Button onClick={() => setIsEditModalOpen(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editează discuția
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Conținut discuție */}
          <div className="md:col-span-3 space-y-6">
            {/* Header discuție */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{thread?.title}</CardTitle>
                    <CardDescription>Creat de {thread?.createdBy || 'Sistem'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {thread?.description ? (
                  <div className="prose max-w-none">
                    <p>{thread.description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Fără descriere</p>
                )}
                
                {thread?.tags && thread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {thread.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Mesaje */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversație</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {isLoadingMessages ? (
                    <div className="space-y-4 animate-pulse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages?.items && messages.items.length > 0 ? (
                    <div className="space-y-4">
                      {messages.items.map(msg => (
                        <div key={msg.id} className="flex gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {msg.sender?.substring(0, 2).toUpperCase() || 'UN'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{msg.sender}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-1 p-3 bg-muted rounded-lg">
                              <p>{msg.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Niciun mesaj</h3>
                      <p className="text-muted-foreground mb-4">
                        Începeți conversația trimițând primul mesaj.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Formular trimitere mesaj */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Scrieți un mesaj..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!message.trim() || sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <span>Se trimite...</span>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        <span>Trimite</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar detalii */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalii discuție</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Participanți */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Participanți</h3>
                  {thread?.participants && thread.participants.length > 0 ? (
                    <div className="space-y-2">
                      {thread.participants.map((participant: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {participant.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{participant}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Fără participanți</p>
                  )}
                </div>
                
                <Separator />
                
                {/* Creat de */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Creat de</p>
                    <p className="font-medium">{thread?.createdBy || 'Sistem'}</p>
                  </div>
                </div>
                
                {/* Data creării */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Creat la</p>
                    <p className="font-medium">
                      {thread?.createdAt ? new Date(thread.createdAt).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
                
                {/* Ultima actualizare */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Actualizat la</p>
                    <p className="font-medium">
                      {thread?.updatedAt ? new Date(thread.updatedAt).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
                
                {/* Statistici */}
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mesaje</p>
                    <p className="font-medium">{messages?.items?.length || 0}</p>
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
                  <Users className="h-4 w-4 mr-2" />
                  Adaugă participanți
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Pin className="h-4 w-4 mr-2" />
                  {thread?.isPinned ? 'Anulează fixare' : 'Fixează discuția'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modal pentru editare */}
      <ThreadModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        thread={thread}
        onSuccess={handleSuccess}
      />
    </CollabLayout>
  );
};

export default ThreadDetailsPage;