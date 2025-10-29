import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, ThumbsUp, Plus, Search, Filter, LightbulbIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useCollabApi from '../../hooks/useCollabApi';
import { CommunityCategory, CommunityThread } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import ThreadModal from '../../components/modals/ThreadModal';
import EmptyState from '../../components/common/EmptyState';
import CollabLayout from '../../components/layout/CollabLayout';

/**
 * Pagina de idei din comunitate
 */
function IdeasPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'popular' | 'recent' | 'implemented' | 'pending'>('all');
  
  // Obține lista de thread-uri din categoria Idei
  const { data, isLoading } = useCollabApi().useCommunityThreads({
    category: CommunityCategory.IDEI,
    search: searchQuery || undefined
  });
  
  // Mutație pentru crearea unei idei noi
  const { mutate: createThread } = useCollabApi().useCreateCommunityThread();
  
  // Filtrează ideile în funcție de căutare și filtru
  const ideas = React.useMemo(() => {
    if (!data?.threads) return [];
    
    // Clonăm pentru a nu modifica datele originale
    let filteredIdeas = [...data.threads];
    
    // Aplicăm filtrare suplimentară
    if (filter === 'implemented') {
      filteredIdeas = filteredIdeas.filter(idea => idea.metadata?.['status'] === 'implemented');
    } else if (filter === 'pending') {
      filteredIdeas = filteredIdeas.filter(idea => 
        idea.metadata?.['status'] === 'pending' || idea.metadata?.['status'] === 'review'
      );
    }
    
    // Sortare în funcție de filtru
    if (filter === 'popular') {
      filteredIdeas.sort((a, b) => ((b.metadata?.['votes'] || 0) - (a.metadata?.['votes'] || 0)));
    } else if (filter === 'recent') {
      filteredIdeas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return filteredIdeas;
  }, [data?.threads, filter]);

  // Handler pentru crearea unei idei noi
  const handleCreateIdea = async (threadData: Partial<CommunityThread>) => {
    try {
      await createThread({
        ...threadData,
        category: CommunityCategory.IDEI,
        companyId: 'current',
        userId: 'current',
        metadata: {
          ...(threadData.metadata || {}),
          votes: 0,
          status: 'pending'
        }
      } as any);
      
      setIsCreateModalOpen(false);
      toast({
        title: 'Idee creată',
        description: 'Ideea ta a fost adăugată cu succes în comunitate.',
      });
    } catch (error) {
      console.error('Error creating idea:', error);
      toast({
        title: 'Eroare',
        description: 'Nu am putut crea ideea. Te rugăm să încerci din nou.',
        variant: 'destructive',
      });
    }
  };

  // Render status badge component
  const renderStatusBadge = (status?: string) => {
    switch(status?.toLowerCase()) {
      case 'implemented':
        return <Badge className="bg-green-500 hover:bg-green-600">Implementată</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">În lucru</Badge>;
      case 'review':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">În analiză</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Respinsă</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">În așteptare</Badge>;
    }
  };

  return (
    <CollabLayout
      title="Idei și Sugestii" 
      subtitle="Propune idei și sugestii pentru îmbunătățirea produselor și serviciilor"
      activeTab="community-ideas"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Caută idei..."
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
                Toate ideile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('popular')}>
                Cele mai votate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('recent')}>
                Cele mai recente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('implemented')}>
                Implementate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('pending')}>
                În așteptare
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Propune o idee
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
        ) : ideas.length === 0 ? (
          <EmptyState
            title="Nu există idei"
            description="Nu am găsit nicio idee care să corespundă criteriilor tale de căutare."
            action={
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Propune prima idee
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {ideas.map((idea) => (
              <Card 
                key={idea.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/collab/community/ideas/${idea.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{idea.title}</CardTitle>
                    {renderStatusBadge(idea.metadata?.['status'])}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`https://avatar.vercel.sh/${idea.createdBy || 'user'}.png`} />
                      <AvatarFallback>{(idea.createdBy || 'U').substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{idea.createdBy || 'Utilizator'}</span>
                    <Clock className="h-4 w-4 ml-2" />
                    <span>
                      {formatDistanceToNow(new Date(idea.createdAt), { locale: ro, addSuffix: true })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="line-clamp-3">
                    {idea.description || 'Fără descriere'}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {idea.metadata?.['tags'] && Array.isArray(idea.metadata['tags']) && (
                      idea.metadata['tags'].map((tag, idx) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{idea.metadata?.['votes'] || 0} voturi</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{idea.replyCount || 0} comentarii</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    {idea.metadata?.['estimatedDelivery'] && (
                      <span>Estimat: {idea.metadata['estimatedDelivery']}</span>
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
          onSubmit={handleCreateIdea}
          category={CommunityCategory.IDEI}
          extraFields={[
            {
              id: 'tags',
              label: 'Etichete (separate prin virgulă)',
              type: 'text',
              placeholder: 'ex: UI, performanță, factură'
            }
          ]}
        />
      </div>
    </CollabLayout>
  );
};

export default IdeasPage;