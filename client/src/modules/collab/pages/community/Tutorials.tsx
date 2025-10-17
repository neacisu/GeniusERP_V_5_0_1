import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Eye, ThumbsUp, Star, Search, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useCollabApi from '../../hooks/useCollabApi';
import { CommunityCategory } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import ThreadModal from '../../components/modals/ThreadModal';
import CommunityHeader from '../../components/community/CommunityHeader';
import CommunityList from '../../components/community/CommunityList';
import CommunityThreadCard from '../../components/community/CommunityThreadCard';
import CollabLayout from '../../components/layout/CollabLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Pagina de tutoriale din comunitate
 */
function TutorialsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'popular' | 'recent' | 'beginner' | 'advanced'>('all');
  
  // Obține lista de thread-uri din categoria Tutoriale
  const { data, isLoading } = useCollabApi().useCommunityThreads({
    category: CommunityCategory.TUTORIALE,
    search: searchQuery || undefined
  });
  
  // Mutație pentru crearea unui tutorial nou
  const { mutate: createThread, isPending: isCreating } = useCollabApi().useCreateCommunityThread();
  
  // Filtrează tutorialele în funcție de căutare și filtru
  const tutorials = React.useMemo(() => {
    if (!data?.threads) return [];
    
    // Clonăm pentru a nu modifica datele originale
    let filteredTutorials = [...data.threads];
    
    // Aplicăm filtrare suplimentară
    if (filter === 'beginner') {
      filteredTutorials = filteredTutorials.filter(tutorial => 
        tutorial.metadata?.level === 'beginner' || tutorial.metadata?.level === 'începător'
      );
    } else if (filter === 'advanced') {
      filteredTutorials = filteredTutorials.filter(tutorial => 
        tutorial.metadata?.level === 'advanced' || tutorial.metadata?.level === 'avansat'
      );
    }
    
    // Sortare în funcție de filtru
    if (filter === 'popular') {
      filteredTutorials.sort((a, b) => ((b.metadata?.views || 0) - (a.metadata?.views || 0)));
    } else if (filter === 'recent') {
      filteredTutorials.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return filteredTutorials;
  }, [data?.threads, filter]);

  // Handler pentru crearea unui tutorial nou
  const handleCreateTutorial = async (tutorialData: any) => {
    try {
      await createThread({
        ...tutorialData,
        category: 'TUTORIALE',
        companyId: 'current',
        userId: 'current',
        metadata: {
          ...(tutorialData.metadata || {}),
          views: 0,
          level: tutorialData.level || 'intermediate',
          duration: tutorialData.duration || null,
        }
      });
      
      setIsCreateModalOpen(false);
      toast({
        title: 'Tutorial creat',
        description: 'Tutorialul tău a fost adăugat cu succes în comunitate.',
      });
    } catch (error) {
      console.error('Error creating tutorial:', error);
      toast({
        title: 'Eroare',
        description: 'Nu am putut crea tutorialul. Te rugăm să încerci din nou.',
        variant: 'destructive',
      });
    }
  };

  // Render difficulty badge
  const renderDifficultyBadge = (level?: string) => {
    switch(level?.toLowerCase()) {
      case 'beginner':
      case 'începător':
        return <Badge className="bg-green-500 hover:bg-green-600">Începător</Badge>;
      case 'advanced':
      case 'avansat':
        return <Badge className="bg-red-500 hover:bg-red-600">Avansat</Badge>;
      default:
        return <Badge className="bg-blue-500 hover:bg-blue-600">Intermediar</Badge>;
    }
  };

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'Toate tutorialele' },
    { value: 'popular', label: 'Cele mai populare' },
    { value: 'recent', label: 'Cele mai recente' },
    { value: 'beginner', label: 'Pentru începători' },
    { value: 'advanced', label: 'Pentru avansați' },
  ];

  return (
    <CollabLayout
      title="Tutoriale" 
      subtitle="Învață și împărtășește cunoștințele tale cu echipa"
      activeTab="community-tutorials"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Caută tutoriale..."
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
              {filterOptions.map(option => (
                <DropdownMenuItem key={option.value} onClick={() => setFilter(option.value as any)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adaugă tutorial
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 w-full bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tutorials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Nu există tutoriale</h3>
              <p className="text-muted-foreground mt-2">
                Nu am găsit niciun tutorial care să corespundă criteriilor tale de căutare.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                Adaugă primul tutorial
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tutorials.map((tutorial) => (
              <Card 
                key={tutorial.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/collab/community/tutorials/${tutorial.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span>{tutorial.title}</span>
                    {renderDifficultyBadge(tutorial.metadata?.level)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="line-clamp-3 mb-4">
                    {tutorial.description || 'Fără descriere'}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2 mb-2">
                    {tutorial.metadata?.duration && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{tutorial.metadata.duration} min</span>
                      </div>
                    )}
                    {tutorial.metadata?.views !== undefined && (
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        <span>{tutorial.metadata.views} vizualizări</span>
                      </div>
                    )}
                    {tutorial.metadata?.rating && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                        <span>{tutorial.metadata.rating}/5</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    {tutorial.metadata?.tags && Array.isArray(tutorial.metadata.tags) && (
                      tutorial.metadata.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <ThreadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTutorial}
          category={CommunityCategory.TUTORIALE}
          extraFields={[
            {
              id: 'level',
              label: 'Nivel de dificultate',
              type: 'select',
              options: [
                { value: 'beginner', label: 'Începător' },
                { value: 'intermediate', label: 'Intermediar' },
                { value: 'advanced', label: 'Avansat' }
              ]
            },
            {
              id: 'duration',
              label: 'Durată estimată (minute)',
              type: 'number',
              placeholder: 'ex: 15'
            },
            {
              id: 'tags',
              label: 'Etichete (separate prin virgulă)',
              type: 'text',
              placeholder: 'ex: Raportare, Excel, Financiar'
            }
          ]}
        />
      </div>
    </CollabLayout>
  );
};

export default TutorialsPage;