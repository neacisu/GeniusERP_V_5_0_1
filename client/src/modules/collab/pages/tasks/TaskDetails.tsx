import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Calendar,
  Users,
  MessageCircle,
  AlertTriangle,
  Tag,
  Edit2
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import CollabLayout from '../../components/layout/CollabLayout';
import { TaskModal } from '../../components/modals';
import useCollabApi from '../../hooks/useCollabApi';
import { Task, TaskStatus, TaskPriority } from '../../types';

/**
 * Pagina de detalii a unei sarcini
 */
const TaskDetailsPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/collab/tasks/:id');
  const { useTask, useTaskComments, useTaskHistory } = useCollabApi();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewTask, setIsNewTask] = useState(false);
  
  const taskId = params?.id;
  
  // Verificăm dacă este o sarcină nouă sau un id existent
  useEffect(() => {
    if (taskId === 'new') {
      setIsNewTask(true);
      setIsEditModalOpen(true);
    }
  }, [taskId]);
  
  // Obține detaliile sarcinii
  const { data: task, isLoading, isError } = useTask(taskId !== 'new' ? taskId : undefined);
  
  // Obține comentariile sarcinii
  const { data: comments, isLoading: isLoadingComments } = useTaskComments(taskId !== 'new' ? taskId : undefined);
  
  // Obține istoricul sarcinii
  const { data: history, isLoading: isLoadingHistory } = useTaskHistory(taskId !== 'new' ? taskId : undefined);
  
  // Handler pentru închiderea modalului
  const handleCloseModal = () => {
    if (isNewTask) {
      navigate('/collab/tasks');
    } else {
      setIsEditModalOpen(false);
    }
  };
  
  // Handler pentru succes la editare/creare
  const handleSuccess = (updatedTask: Task) => {
    if (isNewTask) {
      navigate(`/collab/tasks/${updatedTask.id}`);
    } else {
      setIsEditModalOpen(false);
      // Aici ar veni reîncărcarea datelor
    }
  };
  
  // Funcție pentru a obține clasa de culoare pentru status
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TO_DO:
        return 'bg-slate-500/20 text-slate-700';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-500/20 text-blue-700';
      case TaskStatus.IN_REVIEW:
        return 'bg-purple-500/20 text-purple-700';
      case TaskStatus.COMPLETED:
        return 'bg-emerald-500/20 text-emerald-700';
      case TaskStatus.BLOCKED:
        return 'bg-red-500/20 text-red-700';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };
  
  // Funcție pentru a obține clasa de culoare pentru prioritate
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-slate-500/20 text-slate-700';
      case TaskPriority.NORMAL:
        return 'bg-blue-500/20 text-blue-700';
      case TaskPriority.HIGH:
        return 'bg-amber-500/20 text-amber-700';
      case TaskPriority.URGENT:
        return 'bg-red-500/20 text-red-700';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };
  
  // Dacă se încarcă și nu este o sarcină nouă
  if (isLoading && !isNewTask) {
    return (
      <CollabLayout title="Detalii sarcină" subtitle="Se încarcă..." activeTab="tasks">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </CollabLayout>
    );
  }
  
  // Dacă există o eroare și nu este o sarcină nouă
  if (isError && !isNewTask) {
    return (
      <CollabLayout title="Eroare" subtitle="Sarcina nu a putut fi încărcată" activeTab="tasks">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sarcina nu a putut fi găsită</h2>
              <p className="text-muted-foreground mb-4">
                Sarcina cu ID-ul {taskId} nu există sau nu aveți permisiunile necesare.
              </p>
              <Button onClick={() => navigate('/collab/tasks')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi la lista de sarcini
              </Button>
            </div>
          </CardContent>
        </Card>
      </CollabLayout>
    );
  }
  
  // Dacă este o sarcină nouă, afișăm doar modal-ul
  if (isNewTask) {
    return (
      <CollabLayout title="Sarcină nouă" subtitle="Creați o sarcină nouă" activeTab="tasks">
        <TaskModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      </CollabLayout>
    );
  }
  
  return (
    <CollabLayout 
      title={task?.title || 'Detalii sarcină'} 
      subtitle="Informații și acțiuni pentru sarcină" 
      activeTab="tasks"
    >
      <div className="space-y-6">
        {/* Butoane acțiuni */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/collab/tasks')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la lista de sarcini
          </Button>
          
          <Button onClick={() => setIsEditModalOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editează sarcina
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Detalii sarcină */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{task?.title}</CardTitle>
                    <CardDescription>ID: {task?.id}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getStatusColor(task?.status || TaskStatus.TO_DO)}>
                      {task?.status}
                    </Badge>
                    <Badge className={getPriorityColor(task?.priority || TaskPriority.NORMAL)}>
                      {task?.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="prose max-w-none">
                  <p>{task?.description || 'Fără descriere'}</p>
                </div>
                
                {task?.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {task.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Tab-uri pentru comentarii și activitate */}
            <Tabs defaultValue="comments">
              <TabsList>
                <TabsTrigger value="comments" className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comentarii
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Activitate
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {isLoadingComments ? (
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
                    ) : comments?.items && comments.items.length > 0 ? (
                      <div className="space-y-4">
                        {comments.items.map((comment: { id: string; user?: string; content: string; createdAt: string }) => (
                          <div key={comment.id} className="flex gap-4">
                            <Avatar>
                              <AvatarFallback>
                                {comment.user?.substring(0, 2).toUpperCase() || 'UN'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{comment.user}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">Niciun comentariu</h3>
                        <p className="text-muted-foreground mb-4">
                          Nu există comentarii pentru această sarcină.
                        </p>
                        <Button>
                          Adaugă primul comentariu
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
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
                          Nu există înregistrări de activitate pentru această sarcină.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar detalii */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalii sarcină</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progres */}
                {task?.progress !== undefined && (
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-muted-foreground">Progres</span>
                      <span className="font-medium">{task.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Termen limită */}
                {task?.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Termen limită</p>
                      <p className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                
                {/* Atribuit */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Atribuit</p>
                    {task?.assignedTo ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {task.assignedTo.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{task.assignedTo}</span>
                      </div>
                    ) : (
                      <p className="font-medium">Neatribuit</p>
                    )}
                  </div>
                </div>
                
                {/* Timp estimat */}
                {task?.estimatedHours !== undefined && task.estimatedHours > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Timp estimat</p>
                      <p className="font-medium">{task.estimatedHours} ore</p>
                    </div>
                  </div>
                )}
                
                {/* Creat de */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Creat de</p>
                    <p className="font-medium">{task?.createdBy || 'Sistem'}</p>
                  </div>
                </div>
                
                {/* Data creării */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Creat la</p>
                    <p className="font-medium">
                      {task?.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
                
                {/* Ultima actualizare */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Actualizat la</p>
                    <p className="font-medium">
                      {task?.updatedAt ? new Date(task.updatedAt).toLocaleString() : '-'}
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
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Adaugă comentariu
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marchează ca finalizată
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Reatribuie
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modal pentru editare */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        task={task}
        onSuccess={handleSuccess}
      />
    </CollabLayout>
  );
};

export default TaskDetailsPage;