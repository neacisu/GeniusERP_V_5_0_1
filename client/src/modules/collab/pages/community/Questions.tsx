import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, ThumbsUp, Clock, Filter, Plus, Search } from 'lucide-react';
import useCollabApi from '../../hooks/useCollabApi';
import { CommunityThread } from '../../hooks/useCollabApi';
import ThreadModal from '../../components/modals/ThreadModal';
import { CommunityCategory } from '../../types';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '../../components/common/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import CollabLayout from '../../components/layout/CollabLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Pagina de întrebări din comunitate
 */
const QuestionsPage = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'popular' | 'recent'>('all');
  
  // Obține lista de thread-uri din categoria Questions
  const { data, isLoading } = useCollabApi().useCommunityThreads({
    category: CommunityCategory.INTREBARI,
    search: searchQuery || undefined
  });
  
  // Mutație pentru crearea unui thread nou
  const { mutate: createThread } = useCollabApi().useCreateCommunityThread();
  
  // Filtrează thread-urile în funcție de căutare și filtru
  const threads = React.useMemo(() => {
    if (!data?.threads) return [];
    
    // Clonăm pentru a nu modifica datele originale
    let filteredThreads = [...data.threads];
    
    // Sortare în funcție de filtru
    if (filter === 'popular') {
      filteredThreads.sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0));
    } else if (filter === 'recent') {
      filteredThreads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return filteredThreads;
  }, [data?.threads, filter]);

  // Handler pentru crearea unui thread nou
  const handleCreateThread = async (threadData: Partial<CommunityThread>) => {
    try {
      await createThread({
        ...threadData,
        category: CommunityCategory.INTREBARI,
        companyId: 'current',
        userId: 'current',
      } as any);
      
      setIsCreateModalOpen(false);
      toast({
        title: 'Întrebare creată',
        description: 'Întrebarea ta a fost adăugată cu succes în comunitate.',
      });
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: 'Eroare',
        description: 'Nu am putut crea întrebarea. Te rugăm să încerci din nou.',
        variant: 'destructive',
      });
    }
  };

  return (
    <CollabLayout 
      title="Întrebări și Răspunsuri" 
      subtitle="Întreabă comunitatea și descoperă răspunsuri la întrebările tale"
      activeTab="community-questions"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Caută întrebări..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtrează
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter('all')}>
                Toate întrebările
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('popular')}>
                Cele mai populare
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('recent')}>
                Cele mai recente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adaugă o întrebare
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <EmptyState
            title="Nu există întrebări"
            description="Nu am găsit nicio întrebare care să corespundă criteriilor tale de căutare."
            action={
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adaugă prima întrebare
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Card 
                key={thread.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/collab/community/questions/${thread.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-xl">{thread.title}</CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`https://avatar.vercel.sh/${thread.createdBy || 'user'}.png`} />
                      <AvatarFallback>{(thread.createdBy || 'U').substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{thread.createdBy || 'Utilizator'}</span>
                    <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(thread.createdAt), { locale: ro, addSuffix: true })}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="line-clamp-3">
                    {thread.description || 'Fără descriere'}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {thread.metadata?.tags && Array.isArray(thread.metadata.tags) && (
                      thread.metadata.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{thread.replyCount || 0} răspunsuri</span>
                    </div>
                    {thread.metadata?.likes && (
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{thread.metadata.likes} aprecieri</span>
                      </div>
                    )}
                  </div>
                  <div>
                    {thread.metadata?.solved && (
                      <Badge variant="secondary">Rezolvat</Badge>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        <ThreadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateThread}
          category={CommunityCategory.INTREBARI}
        />
      </div>
    </CollabLayout>
  );
};

export default QuestionsPage;