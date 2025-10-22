import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  MessageSquare, 
  Users, 
  Calendar,
  CheckSquare,
  LucideIcon,
  PanelRightOpen,
  X,
  Bell,
  HelpCircle,
  Lightbulb
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CommunityCategory } from '../types';

interface CollabIntegrationProps {
  moduleContext?: string;
  enableNotifications?: boolean;
  enableCommunity?: boolean;
  enableTasks?: boolean;
}

/**
 * Componenta CollabIntegration
 * 
 * Această componentă permite integrarea funcționalităților de colaborare în orice modul.
 * Poate afișa un panou lateral cu conversații, task-uri și comunitate relevante pentru contextul curent.
 */
const CollabIntegration: React.FC<CollabIntegrationProps> = ({ 
  moduleContext, 
  enableNotifications = true,
  enableCommunity = true,
  enableTasks = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'community' | 'tasks'>('chat');
  const [notificationCount, setNotificationCount] = useState(3);
  
  // Mock data - ar fi înlocuit cu apeluri API reale
  const recentChats = [
    { id: '1', title: 'Discuție Marketing Q2', lastMessage: 'Feedback pentru campania nouă?', participants: 4, unread: 2 },
    { id: '2', title: 'Raportare trimestrială', lastMessage: 'Am actualizat documentele', participants: 2, unread: 0 },
    { id: '3', title: 'Proiect Website', lastMessage: 'Când putem începe faza de testare?', participants: 5, unread: 1 }
  ];
  
  const recentTasks = [
    { id: '1', title: 'Finalizare raport lunar', dueDate: 'Mâine', status: 'pending', priority: 'high' },
    { id: '2', title: 'Review documentație tehnică', dueDate: '2 zile', status: 'in_progress', priority: 'normal' },
    { id: '3', title: 'Ședință planificare sprint', dueDate: 'Azi', status: 'pending', priority: 'urgent' }
  ];
  
  const communityThreads = [
    { id: '1', title: 'Cum pot optimiza rapoartele ANAF?', category: CommunityCategory.INTREBARI, replies: 4 },
    { id: '2', title: 'Anunț: Actualizare platformă în 14 Aprilie', category: CommunityCategory.ANUNTURI, replies: 2 },
    { id: '3', title: 'Idee: Îmbunătățirea exportului de date', category: CommunityCategory.IDEI, replies: 7 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-700';
      case 'in_progress': return 'bg-blue-500/20 text-blue-700';
      case 'completed': return 'bg-emerald-500/20 text-emerald-700';
      case 'blocked': return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-500/20 text-gray-700';
      case 'normal': return 'bg-blue-500/20 text-blue-700';
      case 'high': return 'bg-amber-500/20 text-amber-700';
      case 'urgent': return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case CommunityCategory.ANUNTURI: return <Bell className="h-4 w-4" />;
      case CommunityCategory.INTREBARI: return <HelpCircle className="h-4 w-4" />;
      case CommunityCategory.IDEI: return <Lightbulb className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  // Toggle pentru panoul de colaborare
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Calculăm conținutul relevant pentru modulul curent
  const getContextualTitle = () => {
    if (!moduleContext) return 'Colaborare';
    return `Colaborare ${moduleContext}`;
  };
  
  // Butonul de acces rapid
  const CollabButton = (
    <div className="fixed right-0 top-1/3 z-50 transition-all duration-200" 
      style={{ right: isExpanded ? '320px' : '0' }}>
      <Button 
        onClick={toggleExpanded} 
        variant="default" 
        size="sm" 
        className="h-auto py-6 px-2 rounded-l-md rounded-r-none relative">
        {isExpanded ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <PanelRightOpen className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                {notificationCount}
              </Badge>
            )}
          </>
        )}
      </Button>
    </div>
  );
  
  // Mini-dropdown pentru acces rapid, vizibil doar când panoul este închis
  const CollabDropdown = !isExpanded && (
    <div className="fixed right-4 top-20 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <MessageSquare className="h-4 w-4 mr-2" />
            Colaborare
            {notificationCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                {notificationCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Acces rapid colaborare</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/collab" className="cursor-pointer w-full">
                <Users className="mr-2 h-4 w-4" />
                <span>Tablou de bord</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/collab/tasks" className="cursor-pointer w-full">
                <CheckSquare className="mr-2 h-4 w-4" />
                <span>Sarcini</span>
                {recentTasks.some(t => t.priority === 'urgent') && (
                  <Badge variant="destructive" className="ml-auto">Urgent</Badge>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/collab/threads" className="cursor-pointer w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Discuții</span>
                {recentChats.reduce((sum, chat) => sum + chat.unread, 0) > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {recentChats.reduce((sum, chat) => sum + chat.unread, 0)}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/collab/community" className="cursor-pointer w-full">
                <Users className="mr-2 h-4 w-4" />
                <span>Comunitate</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleExpanded} className="cursor-pointer">
            <PanelRightOpen className="mr-2 h-4 w-4" />
            <span>Deschide panoul</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
  
  // Panoul principal de colaborare
  const CollabPanel = isExpanded && (
    <div 
      className="fixed right-0 top-0 h-screen w-80 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col"
      style={{ height: '100dvh' }}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-medium">{getContextualTitle()}</h2>
        <Button variant="ghost" size="icon" onClick={toggleExpanded}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
        <div className="px-2 pt-2 border-b">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1 flex items-center text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Discuții
            </TabsTrigger>
            {enableCommunity && (
              <TabsTrigger value="community" className="flex-1 flex items-center text-xs">
                <Users className="h-3 w-3 mr-1" />
                Comunitate
              </TabsTrigger>
            )}
            {enableTasks && (
              <TabsTrigger value="tasks" className="flex-1 flex items-center text-xs">
                <CheckSquare className="h-3 w-3 mr-1" />
                Sarcini
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <TabsContent value="chat" className="h-full flex flex-col m-0">
            <div className="p-2">
              <Input placeholder="Caută conversații..." size={1} className="h-8" />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {recentChats.map(chat => (
                  <Link key={chat.id} href={`/collab/threads/${chat.id}`}>
                    <Card className={`cursor-pointer hover:bg-muted/50 ${chat.unread ? 'border-l-4 border-l-primary' : ''}`}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm line-clamp-1">{chat.title}</h4>
                          {chat.unread > 0 && (
                            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                              {chat.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {chat.lastMessage}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex -space-x-2">
                            {Array(Math.min(chat.participants, 3)).fill(0).map((_, i) => (
                              <Avatar key={i} className="h-5 w-5 border border-background">
                                <AvatarFallback className="text-[10px]">
                                  {String.fromCharCode(65 + i)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {chat.participants > 3 && (
                              <Avatar className="h-5 w-5 border border-background">
                                <AvatarFallback className="text-[10px]">
                                  +{chat.participants - 3}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">Acum 2h</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </ScrollArea>
            <div className="p-3 border-t">
              <Button asChild size="sm" className="w-full">
                <Link href="/collab/threads/new">
                  Conversație nouă
                </Link>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="community" className="h-full flex flex-col m-0">
            <div className="p-2">
              <Input placeholder="Caută în comunitate..." size={1} className="h-8" />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {communityThreads.map(thread => (
                  <Link key={thread.id} href={`/collab/community/${thread.category}/${thread.id}`}>
                    <Card className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex gap-2 items-start">
                          <div className={`p-1.5 rounded-full 
                            ${thread.category === CommunityCategory.ANUNTURI ? 'bg-amber-500/20' : 
                              thread.category === CommunityCategory.INTREBARI ? 'bg-blue-500/20' : 
                              'bg-emerald-500/20'}`}>
                            {getCategoryIcon(thread.category)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-clamp-1">{thread.title}</h4>
                            <div className="flex justify-between items-center mt-1">
                              <Badge variant="outline" className="text-[10px] h-5">
                                {thread.category}
                              </Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {thread.replies}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                
                <Card>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm mb-2">Evenimente apropiate</h3>
                    <div className="bg-blue-50 border border-blue-200 p-2 rounded-md">
                      <p className="font-medium text-xs">Sesiune Q&A Raportare ANAF</p>
                      <p className="text-xs flex items-center text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        14 Apr, 14:00
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
            <div className="p-3 border-t">
              <Button asChild size="sm" className="w-full">
                <Link href="/collab/community">
                  Accesează comunitatea
                </Link>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="h-full flex flex-col m-0">
            <div className="p-2">
              <Input placeholder="Caută sarcini..." size={1} className="h-8" />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {recentTasks.map(task => (
                  <Link key={task.id} href={`/collab/tasks/${task.id}`}>
                    <Card className={`cursor-pointer hover:bg-muted/50 ${task.priority === 'urgent' ? 'border-l-4 border-l-red-500' : ''}`}>
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex justify-between items-center mt-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Termen: {task.dueDate}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </ScrollArea>
            <div className="p-3 border-t">
              <Button asChild size="sm" className="w-full">
                <Link href="/collab/tasks/new">
                  Sarcină nouă
                </Link>
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
  
  return (
    <>
      {CollabButton}
      {CollabDropdown}
      {CollabPanel}
    </>
  );
};

export default CollabIntegration;