import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  MessageSquare, 
  Search,
  Users,
  Pin,
  Calendar,
  BookOpen,
  ThumbsUp,
  MessageCircle,
  HelpCircle,
  Lightbulb,
  Bell,
  Plus,
  Filter,
  EyeIcon,
  HeartIcon,
  Clock,
  TagIcon
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import CollabLayout from '../../components/layout/CollabLayout';
import useCollabApi from '../../hooks/useCollabApi';
import { CommunityCategory } from '../../types';
import { useAuth } from '@/hooks/use-auth';

/**
 * Pagina principală a secțiunii Comunitate
 */
function CommunityPage() {
  const { user } = useAuth();
  const { useCommunityThreads, useCreateCommunityThread } = useCollabApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadDescription, setNewThreadDescription] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState(CommunityCategory.GENERAL);
  const [newThreadTags, setNewThreadTags] = useState('');
  
  // Obține thread-uri de comunitate
  const { data: communityResponse, isLoading } = useCommunityThreads();
  
  // Mutație pentru crearea unui thread nou
  const { mutate: createThread, isPending: isCreating } = useCreateCommunityThread();
  
  // Filtrează thread-urile în funcție de căutare și filtru
  const filteredThreads = communityResponse?.threads.filter(thread => {
    const matchesSearch = !searchQuery || 
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (thread.description && thread.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = !activeFilter || thread.category === activeFilter;
    
    return matchesSearch && matchesFilter;
  }) || [];
  
  // Handle pentru crearea unui thread nou
  const handleCreateThread = () => {
    if (!newThreadTitle.trim()) return;
    
    const tagsArray = newThreadTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
      
    if (!user?.companyId || !user?.id) {
      console.error('User not authenticated or missing company');
      return;
    }

    createThread({
      title: newThreadTitle,
      description: newThreadDescription,
      category: newThreadCategory,
      tags: tagsArray,
      isPrivate: false,
      isClosed: false,
      lastMessageAt: new Date().toISOString(),
      createdBy: user.id,
      companyId: user.companyId
    });
    
    // Reset form și închide dialogul
    setNewThreadTitle('');
    setNewThreadDescription('');
    setNewThreadCategory(CommunityCategory.GENERAL);
    setNewThreadTags('');
    setIsCreateDialogOpen(false);
  };

  // Categorii populare pentru comunitate
  const popularCategories = [
    { id: CommunityCategory.GENERAL, name: 'General', icon: <MessageCircle className="h-4 w-4" /> },
    { id: CommunityCategory.ANUNTURI, name: 'Anunțuri', icon: <Bell className="h-4 w-4" /> },
    { id: CommunityCategory.INTREBARI, name: 'Întrebări', icon: <HelpCircle className="h-4 w-4" /> },
    { id: CommunityCategory.IDEI, name: 'Idei', icon: <Lightbulb className="h-4 w-4" /> },
    { id: CommunityCategory.EVENIMENTE, name: 'Evenimente', icon: <Calendar className="h-4 w-4" /> },
    { id: CommunityCategory.RESURSE, name: 'Resurse', icon: <BookOpen className="h-4 w-4" /> }
  ];
  
  // Mock pentru thread-uri populare (ar fi înlocuit cu date reale)
  const pinnedThreads = communityResponse?.threads.filter(thread => thread.isPinned) || [];
  
  return (
    <CollabLayout title="Comunitate" subtitle="Întrebări, idei și discuții cu echipa" activeTab="community-general">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Sidebar left */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categorii</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <nav className="space-y-1">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${activeFilter === null ? 'bg-muted' : ''}`}
                  onClick={() => setActiveFilter(null)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Toate
                </Button>
                
                {popularCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant="ghost"
                    className={`w-full justify-start ${activeFilter === category.id ? 'bg-muted' : ''}`}
                    onClick={() => setActiveFilter(category.id)}
                  >
                    {category.icon}
                    <span className="ml-2">{category.name}</span>
                  </Button>
                ))}
              </nav>
            </CardContent>
            <CardFooter className="pt-0">
              <Link href="/collab/community/resources" className="text-sm text-primary hover:underline">
                Vezi toate resursele
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută în Comunitate..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Subiect nou
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Creare subiect nou</DialogTitle>
                  <DialogDescription>
                    Împarte întrebările, ideile și anunțurile tale cu comunitatea.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titlu</Label>
                    <Input 
                      id="title" 
                      placeholder="Adaugă un titlu clar și descriptiv" 
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categorie</Label>
                    <Select value={newThreadCategory} onValueChange={(value: any) => setNewThreadCategory(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează o categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(CommunityCategory).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descriere</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Oferă detalii despre întrebarea sau subiectul tău" 
                      rows={4}
                      value={newThreadDescription}
                      onChange={(e) => setNewThreadDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tag-uri (separate prin virgulă)</Label>
                    <Input 
                      id="tags" 
                      placeholder="Ex: important, întrebare, ajutor" 
                      value={newThreadTags}
                      onChange={(e) => setNewThreadTags(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Anulează
                  </Button>
                  <Button type="button" onClick={handleCreateThread} disabled={!newThreadTitle.trim() || isCreating}>
                    {isCreating ? 'Se creează...' : 'Publică'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Pinned threads */}
          {pinnedThreads.length > 0 && (
            <Card className="border-amber-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Pin className="h-4 w-4 mr-2 text-amber-500" />
                  Subiecte importante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pinnedThreads.map((thread) => (
                    <div key={thread.id} className="flex items-start gap-3">
                      <div className="bg-amber-500/10 p-2 rounded-full">
                        {thread.category === CommunityCategory.ANUNTURI ? (
                          <Bell className="h-4 w-4 text-amber-600" />
                        ) : (
                          <MessageCircle className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <Link href={`/collab/community/${thread.category}/${thread.id}`} className="font-medium hover:underline">
                          {thread.title}
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {thread.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Thread list */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Toate discuțiile</CardTitle>
                <Select defaultValue="latest">
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue placeholder="Sortează după" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Cele mai recente</SelectItem>
                    <SelectItem value="popular">Cele mai populare</SelectItem>
                    <SelectItem value="active">Cele mai active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  // Skeleton loading
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-4 pb-4 border-b">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="w-full space-y-2">
                        <Skeleton className="h-5 w-4/5" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-14" />
                          <Skeleton className="h-4 w-14" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredThreads.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Nicio discuție găsită</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? 'Nu am găsit discuții care să corespundă căutării tale.' 
                        : 'Nu există încă discuții în această categorie.'}
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      Creează primul subiect
                    </Button>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <div key={thread.id} className="flex gap-4 pb-4 border-b">
                      <Avatar>
                        <AvatarFallback>{thread.createdBy?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <Link 
                            href={`/collab/community/${thread.category}/${thread.id}`} 
                            className="font-medium hover:underline">
                            {thread.title}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {new Date(thread.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {thread.description}
                        </p>
                        
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge className="bg-blue-500/20 border-blue-500 text-blue-700">
                            {thread.category}
                          </Badge>
                          
                          {thread.tags?.map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          
                          <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              {thread.viewCount || 0}
                            </div>
                            <div className="flex items-center">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {thread.replyCount || 0}
                            </div>
                            <div className="flex items-center">
                              <HeartIcon className="h-3 w-3 mr-1" />
                              {thread.likeCount || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              {filteredThreads.length > 0 && (
                <Button variant="outline" className="w-full">
                  Încarcă mai multe
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        
        {/* Sidebar right - only visible on desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="space-y-6">
            {/* Stats card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Statistici comunitate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subiecte</span>
                    <span className="font-medium">{communityResponse?.pagination?.totalItems || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Membri activi</span>
                    <span className="font-medium">32</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Răspunsuri</span>
                    <span className="font-medium">128</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Popular tags */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tag-uri populare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <TagIcon className="mr-1 h-3 w-3" /> contabilitate
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <TagIcon className="mr-1 h-3 w-3" /> ajutor
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <TagIcon className="mr-1 h-3 w-3" /> raportare
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <TagIcon className="mr-1 h-3 w-3" /> proiecte
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <TagIcon className="mr-1 h-3 w-3" /> tutorial
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <TagIcon className="mr-1 h-3 w-3" /> anaf
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            {/* Active members */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Membri activi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AB</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>CD</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>EF</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>GH</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>IJ</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>+27</AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
            
            {/* Events reminder */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evenimente</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <Link href="/collab/community/events/1" className="block">
                    <div className="bg-blue-50 border border-blue-200 p-2 rounded-md">
                      <p className="font-medium text-sm">Sesiune Q&A Raportare ANAF</p>
                      <p className="text-xs flex items-center text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        14 Apr, 14:00
                      </p>
                    </div>
                  </Link>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/collab/community/events" className="text-sm text-primary hover:underline">
                  Vezi toate evenimentele
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </CollabLayout>
  );
};

export default CommunityPage;