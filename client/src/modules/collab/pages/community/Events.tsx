import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, Plus, Search, Filter, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useCollabApi from '../../hooks/useCollabApi';
import { CommunityCategory, CommunityThread } from '../../types';
import { formatDistanceToNow, format } from 'date-fns';
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
import CommunityHeader from '../../components/community/CommunityHeader';
import CommunityList from '../../components/community/CommunityList';
import CommunityThreadCard from '../../components/community/CommunityThreadCard';
import CollabLayout from '../../components/layout/CollabLayout';

/**
 * Pagina de evenimente din comunitate
 */
function EventsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'today'>('all');
  
  // Obține lista de thread-uri din categoria Evenimente
  const { data, isLoading } = useCollabApi().useCommunityThreads({
    category: CommunityCategory.EVENIMENTE,
    search: searchQuery || undefined
  });
  
  // Mutație pentru crearea unui eveniment nou
  const { mutate: createThread } = useCollabApi().useCreateCommunityThread();
  
  // Filtrează evenimentele în funcție de căutare și filtru
  const events = React.useMemo(() => {
    if (!data?.threads) return [];
    
    // Clonăm pentru a nu modifica datele originale
    let filteredEvents = [...data.threads];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Aplicăm filtrare suplimentară
    if (filter === 'upcoming') {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = event.metadata?.eventDate ? new Date(event.metadata.eventDate) : null;
        return eventDate && eventDate >= today;
      });
    } else if (filter === 'past') {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = event.metadata?.eventDate ? new Date(event.metadata.eventDate) : null;
        return eventDate && eventDate < today;
      });
    } else if (filter === 'today') {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = event.metadata?.eventDate ? new Date(event.metadata.eventDate) : null;
        if (!eventDate) return false;
        return (
          eventDate.getDate() === today.getDate() &&
          eventDate.getMonth() === today.getMonth() &&
          eventDate.getFullYear() === today.getFullYear()
        );
      });
    }
    
    // Sortăm evenimentele după dată (cele mai apropiate primele)
    filteredEvents.sort((a, b) => {
      const dateA = a.metadata?.eventDate ? new Date(a.metadata.eventDate) : new Date(a.createdAt);
      const dateB = b.metadata?.eventDate ? new Date(b.metadata.eventDate) : new Date(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });
    
    return filteredEvents;
  }, [data?.threads, filter]);

  // Handler pentru crearea unui eveniment nou
  const handleCreateEvent = async (threadData: Partial<CommunityThread>) => {
    try {
      // Procesăm datele specifice pentru evenimente
      const eventDate = threadData.metadata?.eventDate || null;
      const eventTime = threadData.metadata?.eventTime || null;
      
      // Combinăm data și ora într-un singur câmp ISO
      let combinedDateTime = null;
      if (eventDate) {
        if (eventTime) {
          const [hours, minutes] = eventTime.split(':').map(Number);
          const date = new Date(eventDate);
          date.setHours(hours, minutes, 0, 0);
          combinedDateTime = date.toISOString();
        } else {
          combinedDateTime = new Date(eventDate).toISOString();
        }
      }
      
      await createThread({
        ...threadData,
        category: CommunityCategory.EVENIMENTE,
        companyId: 'current',
        userId: 'current',
        metadata: {
          ...(threadData.metadata || {}),
          eventDate: combinedDateTime,
          participants: [],
          location: threadData.metadata?.location || null
        }
      } as any);
      
      setIsCreateModalOpen(false);
      toast({
        title: 'Eveniment creat',
        description: 'Evenimentul tău a fost adăugat cu succes în comunitate.',
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Eroare',
        description: 'Nu am putut crea evenimentul. Te rugăm să încerci din nou.',
        variant: 'destructive',
      });
    }
  };

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'Toate evenimentele' },
    { value: 'upcoming', label: 'Următoarele evenimente' },
    { value: 'today', label: 'Astăzi' },
    { value: 'past', label: 'Evenimente trecute' },
  ];

  // Render custom event card
  const renderEventCard = (event: CommunityThread) => {
    const eventDate = event.metadata?.eventDate ? new Date(event.metadata.eventDate) : null;
    const location = event.metadata?.location;
    const participantCount = Array.isArray(event.metadata?.participants) ? event.metadata?.participants.length : 0;
    
    // Determine badge status based on date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let status: 'upcoming' | 'today' | 'past' = 'upcoming';
    
    if (eventDate) {
      const eventDateOnly = new Date(eventDate);
      eventDateOnly.setHours(0, 0, 0, 0);
      
      if (eventDateOnly.getTime() === today.getTime()) {
        status = 'today';
      } else if (eventDate < today) {
        status = 'past';
      }
    }
    
    // Render status badge
    const renderStatusBadge = () => {
      switch(status) {
        case 'upcoming':
          return <Badge className="bg-blue-500 hover:bg-blue-600">Urmează</Badge>;
        case 'today':
          return <Badge className="bg-green-500 hover:bg-green-600">Astăzi</Badge>;
        case 'past':
          return <Badge variant="outline">Finalizat</Badge>;
      }
    };
    
    return (
      <CommunityThreadCard
        thread={event}
        basePath="/collab/community/events"
        statusBadge={renderStatusBadge()}
        extraContent={
          <div className="space-y-2 mt-3 text-sm text-muted-foreground">
            {eventDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(eventDate, 'EEEE, d MMMM yyyy', { locale: ro })}
                  {eventDate.getHours() > 0 || eventDate.getMinutes() > 0 ? ` • ${format(eventDate, 'HH:mm')}` : ''}
                </span>
              </div>
            )}
            
            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{participantCount} participanți</span>
            </div>
          </div>
        }
        extraFooter={
          <Button 
            variant="outline" 
            size="sm" 
            disabled={status === 'past'}
            onClick={(e) => {
              e.stopPropagation();
              // Here would go the participation logic
              toast({
                title: status === 'past' ? 'Eveniment încheiat' : 'Participare înregistrată',
                description: status === 'past' 
                  ? 'Acest eveniment s-a încheiat deja.' 
                  : 'Te-ai înscris cu succes la acest eveniment.',
              });
            }}
          >
            {status === 'past' ? 'Eveniment încheiat' : 'Participă'}
          </Button>
        }
      />
    );
  };

  return (
    <CollabLayout
      title="Evenimente"
      subtitle="Descoperă și participă la evenimente organizate în cadrul companiei"
      activeTab="community-events"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Caută evenimente..."
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
            Adaugă eveniment
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
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Nu există evenimente</h3>
              <p className="text-muted-foreground mt-2">
                Nu am găsit niciun eveniment care să corespundă criteriilor tale de căutare.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                Adaugă primul eveniment
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => renderEventCard(event))}
          </div>
        )}
        
        <ThreadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateEvent}
          category={CommunityCategory.EVENIMENTE}
          extraFields={[
            {
              id: 'eventDate',
              label: 'Data evenimentului',
              type: 'date',
              required: true,
            },
            {
              id: 'eventTime',
              label: 'Ora evenimentului',
              type: 'time',
            },
            {
              id: 'location',
              label: 'Locația',
              type: 'text',
              placeholder: 'Online sau o locație fizică'
            }
          ]}
        />
      </div>
    </CollabLayout>
  );
};

export default EventsPage;