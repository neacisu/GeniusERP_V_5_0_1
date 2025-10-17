import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Download, Clock, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useCollabApi from '../../hooks/useCollabApi';
import { CommunityCategory } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import ThreadModal from '../../components/modals/ThreadModal';
import CommunityHeader from '../../components/community/CommunityHeader';
import CommunityList from '../../components/community/CommunityList';
import CollabLayout from '../../components/layout/CollabLayout';

/**
 * Pagina de resurse din comunitate
 */
function ResourcesPage() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'popular' | 'recent' | 'documents' | 'links'>('all');
  
  // Obține lista de thread-uri din categoria Resurse
  const { data, isLoading } = useCollabApi().useCommunityThreads({
    category: CommunityCategory.RESURSE,
    search: searchQuery || undefined
  });
  
  // Mutație pentru crearea unei resurse noi
  const { mutate: createThread, isPending: isCreating } = useCollabApi().useCreateCommunityThread();
  
  // Filtrează resursele în funcție de căutare și filtru
  const resources = React.useMemo(() => {
    if (!data?.threads) return [];
    
    // Clonăm pentru a nu modifica datele originale
    let filteredResources = [...data.threads];
    
    // Aplicăm filtrare suplimentară
    if (filter === 'documents') {
      filteredResources = filteredResources.filter(resource => 
        resource.metadata?.type === 'document' || resource.metadata?.type === 'file'
      );
    } else if (filter === 'links') {
      filteredResources = filteredResources.filter(resource => 
        resource.metadata?.type === 'link' || resource.metadata?.type === 'url'
      );
    }
    
    // Sortare în funcție de filtru
    if (filter === 'popular') {
      filteredResources.sort((a, b) => ((b.metadata?.downloads || 0) - (a.metadata?.downloads || 0)));
    } else if (filter === 'recent') {
      filteredResources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return filteredResources;
  }, [data?.threads, filter]);

  // Handler pentru crearea unei resurse noi
  const handleCreateResource = async (resourceData: any) => {
    try {
      // Procesăm datele înainte de a le trimite
      const type = resourceData.url ? 'link' : 'document';
      
      await createThread({
        ...resourceData,
        category: 'RESURSE',
        companyId: 'current',
        userId: 'current',
        metadata: {
          ...(resourceData.metadata || {}),
          type,
          downloads: 0,
          fileSize: resourceData.fileSize || null,
          fileType: resourceData.fileType || null,
        }
      });
      
      setIsCreateModalOpen(false);
      toast({
        title: 'Resursă adăugată',
        description: 'Resursa ta a fost adăugată cu succes în comunitate.',
      });
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: 'Eroare',
        description: 'Nu am putut crea resursa. Te rugăm să încerci din nou.',
        variant: 'destructive',
      });
    }
  };

  // Render resource card
  const renderResource = (resource: any) => {
    const isExternal = resource.metadata?.type === 'link' || resource.metadata?.url;
    const fileInfo = resource.metadata?.fileType 
      ? `${resource.metadata.fileType.toUpperCase()}${resource.metadata.fileSize ? ` · ${resource.metadata.fileSize}` : ''}`
      : null;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-start justify-between">
            <span>{resource.title}</span>
            <Badge variant={isExternal ? "outline" : "secondary"}>
              {isExternal ? 'Link extern' : 'Document'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="line-clamp-2 mb-4">
            {resource.description || 'Fără descriere'}
          </div>
          
          {fileInfo && (
            <div className="text-sm text-muted-foreground mb-2">
              {fileInfo}
            </div>
          )}
          
          <div className="flex space-x-2 text-sm text-muted-foreground mb-4">
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatDistanceToNow(new Date(resource.createdAt), { locale: ro, addSuffix: true })}
            </span>
            {resource.metadata?.downloads && (
              <span className="flex items-center">
                <Download className="h-4 w-4 mr-1" />
                {resource.metadata.downloads} descărcări
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            {resource.metadata?.tags && Array.isArray(resource.metadata.tags) && (
              resource.metadata.tags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="secondary">{tag}</Badge>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {resource.createdBy || 'Utilizator'}
          </div>
          <Button size="sm" variant="outline">
            {isExternal ? (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Vizitează
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Descarcă
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'Toate resursele' },
    { value: 'popular', label: 'Cele mai populare' },
    { value: 'recent', label: 'Cele mai recente' },
    { value: 'documents', label: 'Documente' },
    { value: 'links', label: 'Linkuri externe' },
  ];

  return (
    <CollabLayout
      title="Resurse"
      subtitle="Descoperă și împărtășește resurse utile cu echipa ta"
      activeTab="community-resources"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="search"
              placeholder="Caută resurse..."
              className="w-full pl-8 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex-shrink-0">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Adaugă resursă
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
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Nu există resurse</h3>
              <p className="text-muted-foreground mt-2">
                Nu am găsit nicio resursă care să corespundă criteriilor tale de căutare.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                Adaugă prima resursă
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => renderResource(resource))}
          </div>
        )}
        
        <ThreadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateResource}
          category={CommunityCategory.RESURSE}
          extraFields={[
            {
              id: 'url',
              label: 'URL (pentru resurse externe)',
              type: 'url',
              placeholder: 'https://example.com/resource'
            },
            {
              id: 'tags',
              label: 'Etichete (separate prin virgulă)',
              type: 'text',
              placeholder: 'ex: tutorial, ghid, template'
            }
          ]}
        />
      </div>
    </CollabLayout>
  );
};

export default ResourcesPage;