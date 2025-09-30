import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  MessageSquare, 
  CheckSquare, 
  Users, 
  Calendar,
  FileText, 
  ArrowRight,
  List,
  Grid3X3,
  LayoutGrid,
  Plus
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import CollabLayout from '../../components/layout/CollabLayout';
import useCollabApi from '../../hooks/useCollabApi';
import { TaskStatus, TaskPriority } from '../../types';

// Importăm componentele create
import { TaskCard, ThreadCard, NoteCard, AnnouncementCard } from '../../components/cards';
import { TaskModal, ThreadModal, NoteModal } from '../../components/modals';

/**
 * Pagina de prezentare generală a modulului de colaborare
 */
const OverviewPage: React.FC = () => {
  const { useRecentTasks, useRecentThreads, useRecentNotes, useCommunityThreads } = useCollabApi();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // State pentru modaluri
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
  // Obține date recente
  const { data: recentTasks, isLoading: isLoadingTasks } = useRecentTasks();
  const { data: recentThreads, isLoading: isLoadingThreads } = useRecentThreads();
  const { data: recentNotes, isLoading: isLoadingNotes } = useRecentNotes();
  const { data: announcements, isLoading: isLoadingAnnouncements } = useCommunityThreads({ 
    category: 'ANUNTURI',
    limit: 5
  });
  
  // Calculează statistici
  const getTasksByStatus = (status: TaskStatus) => {
    return recentTasks?.tasks.filter(task => task.status === status).length || 0;
  };
  
  const getTasksByPriority = (priority: TaskPriority) => {
    return recentTasks?.tasks.filter(task => task.priority === priority).length || 0;
  };

  const getStatusBadgeColor = (status: TaskStatus) => {
    switch(status) {
      case TaskStatus.PENDING: return 'bg-slate-500/20 text-slate-700';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-500/20 text-blue-700';
      case TaskStatus.REVIEW: return 'bg-purple-500/20 text-purple-700';
      case TaskStatus.COMPLETED: return 'bg-emerald-500/20 text-emerald-700';
      case TaskStatus.BLOCKED: return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getPriorityBadgeColor = (priority: TaskPriority) => {
    switch(priority) {
      case TaskPriority.LOW: return 'bg-slate-500/20 text-slate-700';
      case TaskPriority.NORMAL: return 'bg-blue-500/20 text-blue-700';
      case TaskPriority.HIGH: return 'bg-amber-500/20 text-amber-700';
      case TaskPriority.URGENT: return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  return (
    <CollabLayout title="Colaborare" subtitle="Gestionează sarcini, notițe și colaborează cu echipa" activeTab="overview">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Sidebar stânga - carduri cu statistici */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activitate</CardTitle>
              <CardDescription>Activitatea ta recentă</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sarcini atribuite</span>
                  <span className="font-medium">{recentTasks?.stats?.assigned || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sarcini în desfășurare</span>
                  <span className="font-medium">{getTasksByStatus(TaskStatus.IN_PROGRESS)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discuții active</span>
                  <span className="font-medium">{recentThreads?.stats?.active || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Notițe create</span>
                  <span className="font-medium">{recentNotes?.stats?.created || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sarcini după status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.values(TaskStatus).map(status => (
                  <div key={status} className="flex justify-between items-center text-sm">
                    <Badge className={getStatusBadgeColor(status)}>
                      {status}
                    </Badge>
                    <span className="font-medium">{getTasksByStatus(status)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sarcini după prioritate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.values(TaskPriority).map(priority => (
                  <div key={priority} className="flex justify-between items-center text-sm">
                    <Badge className={getPriorityBadgeColor(priority)}>
                      {priority}
                    </Badge>
                    <span className="font-medium">{getTasksByPriority(priority)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Acțiuni rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsTaskModalOpen(true)}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Creează sarcină
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsThreadModalOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Inițiază o discuție
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsNoteModalOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Adaugă notiță
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Conținut principal */}
        <div className="md:col-span-2 lg:col-span-3 space-y-6">
          {/* Anunțuri importante */}
          {(announcements?.threads.length || 0) > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Anunțuri importante</h2>
                <Link href="/collab/community/announcements" className="text-sm text-primary flex items-center hover:underline">
                  <span>Vezi toate</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {isLoadingAnnouncements ? (
                  <Card className="p-6 animate-pulse">
                    <div className="h-24 bg-muted rounded-md"></div>
                  </Card>
                ) : (
                  announcements?.threads
                    .filter(thread => thread.isPinned)
                    .slice(0, 1)
                    .map(announcement => (
                      <AnnouncementCard 
                        key={announcement.id} 
                        announcement={announcement}
                        featured={true}
                      />
                    ))
                )}
              </div>
            </div>
          )}
          
          {/* Tabs pentru task-uri, discuții și notițe */}
          <Tabs defaultValue="tasks">
            <div className="flex justify-between items-center mb-2">
              <TabsList>
                <TabsTrigger value="tasks" className="flex items-center">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Sarcini
                </TabsTrigger>
                <TabsTrigger value="threads" className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Discuții
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Notițe
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <TabsContent value="tasks" className="m-0">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Sarcinile mele recente</CardTitle>
                    <Link href="/collab/tasks" className="text-sm text-primary flex items-center hover:underline">
                      <span>Vezi toate</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingTasks ? (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                      {Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="p-6 animate-pulse">
                          <div className="h-24 bg-muted rounded-md"></div>
                        </Card>
                      ))}
                    </div>
                  ) : recentTasks?.tasks && recentTasks.tasks.length > 0 ? (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                      {recentTasks.tasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Nicio sarcină</h3>
                      <p className="text-muted-foreground mb-4">
                        Nu ai nicio sarcină asignată momentan.
                      </p>
                      <Button onClick={() => setIsTaskModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Creează o sarcină
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="threads" className="m-0">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Discuții recente</CardTitle>
                    <Link href="/collab/threads" className="text-sm text-primary flex items-center hover:underline">
                      <span>Vezi toate</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingThreads ? (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                      {Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="p-6 animate-pulse">
                          <div className="h-24 bg-muted rounded-md"></div>
                        </Card>
                      ))}
                    </div>
                  ) : recentThreads?.threads && recentThreads.threads.length > 0 ? (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                      {recentThreads.threads.map(thread => (
                        <ThreadCard key={thread.id} thread={thread} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Nicio discuție</h3>
                      <p className="text-muted-foreground mb-4">
                        Nu ai nicio discuție activă momentan.
                      </p>
                      <Button onClick={() => setIsThreadModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Creează o discuție
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes" className="m-0">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Notițe recente</CardTitle>
                    <Link href="/collab/notes" className="text-sm text-primary flex items-center hover:underline">
                      <span>Vezi toate</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingNotes ? (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                      {Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="p-6 animate-pulse">
                          <div className="h-24 bg-muted rounded-md"></div>
                        </Card>
                      ))}
                    </div>
                  ) : recentNotes?.notes && recentNotes.notes.length > 0 ? (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                      {recentNotes.notes.map(note => (
                        <NoteCard key={note.id} note={note} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Nicio notiță</h3>
                      <p className="text-muted-foreground mb-4">
                        Nu ai creat nicio notiță momentan.
                      </p>
                      <Button onClick={() => setIsNoteModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Creează o notiță
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Evenimente viitoare */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Evenimente și întâlniri viitoare</CardTitle>
                <Link href="/collab/community/events" className="text-sm text-primary flex items-center hover:underline">
                  <span>Toate evenimentele</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <Badge className="bg-blue-500/20 text-blue-700 border-blue-300">
                        <Calendar className="h-4 w-4 mr-1" />
                        Training
                      </Badge>
                    </div>
                    <h3 className="font-medium">Sesiune Q&A Raportare ANAF</h3>
                    <p className="text-sm text-muted-foreground mt-1">14 Apr, 14:00</p>
                    <p className="text-sm mt-2">
                      Sesiune de întrebări și răspunsuri pentru raportările ANAF.
                    </p>
                    <Button className="w-full mt-4" variant="outline" size="sm">
                      Vezi detalii
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-300">
                        <Calendar className="h-4 w-4 mr-1" />
                        Workshop
                      </Badge>
                    </div>
                    <h3 className="font-medium">Workshop Contabilitate Avansată</h3>
                    <p className="text-sm text-muted-foreground mt-1">17 Apr, 10:00</p>
                    <p className="text-sm mt-2">
                      Workshop pentru operațiuni contabile avansate.
                    </p>
                    <Button className="w-full mt-4" variant="outline" size="sm">
                      Vezi detalii
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modaluri pentru acțiuni rapide */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => {
          // Aici ar veni reîncărcarea datelor după creare
        }}
      />
      
      <ThreadModal
        isOpen={isThreadModalOpen}
        onClose={() => setIsThreadModalOpen(false)}
        onSuccess={() => {
          // Aici ar veni reîncărcarea datelor după creare
        }}
      />
      
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSuccess={() => {
          // Aici ar veni reîncărcarea datelor după creare
        }}
      />
    </CollabLayout>
  );
};

export default OverviewPage;