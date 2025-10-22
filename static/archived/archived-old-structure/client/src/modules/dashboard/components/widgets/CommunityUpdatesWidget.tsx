/**
 * Community Updates Widget
 * 
 * Dashboard widget that displays recent community updates from the collaboration module,
 * including announcements, questions, ideas, and events.
 */

import React, { useState } from 'react';
import useCollabApi from '@/modules/collab/hooks/useCollabApi';
import { CommunityCategory, CommunityThread } from '@/modules/collab/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'wouter';
import { 
  Megaphone,
  HelpCircle,
  Lightbulb,
  CalendarDays,
  Users,
  Loader2,
  Eye,
  MessageSquare,
  Pin,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CommunityUpdatesWidgetProps {
  limit?: number;
}

export default function CommunityUpdatesWidget({ limit = 5 }: CommunityUpdatesWidgetProps) {
  const [category, setCategory] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const { useCommunityThreads } = useCollabApi();
  const { toast } = useToast();
  
  // Fetch community threads
  const { data, isLoading, error, refetch: originalRefetch } = useCommunityThreads({
    category: category !== 'all' ? category as CommunityCategory : undefined,
    limit
  });
  
  // Custom refetch function that updates the last updated timestamp
  const refetch = async () => {
    const result = await originalRefetch();
    setLastUpdated(new Date());
    toast({
      title: "Actualizare efectuată",
      description: "Conținutul comunității a fost actualizat cu succes.",
      variant: "default",
    });
    return result;
  };
  
  // Parse threads data ONLY when not loading and data exists
  // This prevents console warnings during the loading state
  const parseThreadsData = (): CommunityThread[] => {
    // Return empty array if loading or no data
    if (isLoading || !data) {
      return [];
    }
    
    // Handle various response formats and ensure we always have an array
    let threadsData: any[] = [];
    
    // Case 1: Response has threads property with array
    if (typeof data === 'object' && 'threads' in data && Array.isArray(data.threads)) {
      threadsData = data.threads;
    } 
    // Case 2: Response has items property with array
    else if (typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
      threadsData = data.items;
    }
    // Case 3: Response is already an array
    else if (Array.isArray(data)) {
      threadsData = data;
    }
    // Case 4: Response is a different format - log only in development
    else if (process.env.NODE_ENV === 'development') {
      console.warn('Community response does not contain expected array format:', data);
    }
    
    return threadsData as CommunityThread[];
  };
  
  // Get parsed threads - this will be empty array during loading
  const threads: CommunityThread[] = parseThreadsData();
  
  // Format the thread creation time
  const formatThreadTime = (dateString: Date | string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ro
    });
  };
  
  // Get icon based on category
  const getCategoryIcon = (category: string | undefined) => {
    if (!category) return <Users className="h-4 w-4 text-gray-500" />;
    
    switch (category) {
      case CommunityCategory.ANUNTURI:
        return <Megaphone className="h-4 w-4 text-primary" />;
      case CommunityCategory.INTREBARI:
        return <HelpCircle className="h-4 w-4 text-blue-500" />;
      case CommunityCategory.IDEI:
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case CommunityCategory.EVENIMENTE:
        return <CalendarDays className="h-4 w-4 text-green-500" />;
      case CommunityCategory.RESURSE:
        return <Users className="h-4 w-4 text-purple-500" />;
      case CommunityCategory.TUTORIALE:
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get category label in Romanian
  const getCategoryLabel = (category: string | undefined) => {
    if (!category) return 'General';
    
    switch (category) {
      case CommunityCategory.ANUNTURI:
        return 'Anunț';
      case CommunityCategory.INTREBARI:
        return 'Întrebare';
      case CommunityCategory.IDEI:
        return 'Idee';
      case CommunityCategory.EVENIMENTE:
        return 'Eveniment';
      case CommunityCategory.RESURSE:
        return 'Resursă';
      case CommunityCategory.TUTORIALE:
        return 'Tutorial';
      default:
        return 'General';
    }
  };
  
  // Get category color class
  const getCategoryColorClass = (category: string | undefined) => {
    if (!category) return 'bg-gray-100 text-gray-700';
    
    switch (category) {
      case CommunityCategory.ANUNTURI:
        return 'bg-primary/10 text-primary';
      case CommunityCategory.INTREBARI:
        return 'bg-blue-100 text-blue-700';
      case CommunityCategory.IDEI:
        return 'bg-yellow-100 text-yellow-700';
      case CommunityCategory.EVENIMENTE:
        return 'bg-green-100 text-green-700';
      case CommunityCategory.RESURSE:
        return 'bg-purple-100 text-purple-700';
      case CommunityCategory.TUTORIALE:
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">Comunitate</CardTitle>
            <CardDescription>
              Anunțuri și discuții din comunitate
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/collab/community">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Vezi Toate</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vezi toate postările din comunitate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <div className="px-4 pb-2">
        <Tabs 
          defaultValue="all" 
          value={category} 
          onValueChange={setCategory} 
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">Toate</TabsTrigger>
            <TabsTrigger value={CommunityCategory.ANUNTURI}>Anunțuri</TabsTrigger>
            <TabsTrigger value={CommunityCategory.INTREBARI}>Întrebări</TabsTrigger>
            <TabsTrigger value={CommunityCategory.IDEI}>Idei</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Nu s-au putut încărca postările din comunitate.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Încearcă din nou
            </Button>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nu există postări în comunitate care să corespundă filtrului.</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {threads.map((thread: CommunityThread) => {
                // Valori implicite pentru proprietăți opționale pentru siguranță
                const viewCount = (thread.metadata && 'viewCount' in thread.metadata) ? thread.metadata.viewCount : 0;
                const replyCount = thread.replyCount || 0;
                const authorName = thread.metadata?.authorName || 'Utilizator';
                const authorAvatar = thread.metadata?.authorAvatar || '';
                const authorInitials = authorName ? authorName.substring(0, 2).toUpperCase() : 'U';
                
                return (
                  <div 
                    key={thread.id} 
                    className={cn(
                      "border rounded-lg p-3 hover:bg-gray-50 transition-colors",
                      thread.isPinned && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", getCategoryColorClass(thread.category))}>
                          {getCategoryLabel(thread.category)}
                        </Badge>
                        {thread.isPinned && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Pin className="h-3 w-3 text-primary" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Fixat</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatThreadTime(thread.createdAt)}
                      </time>
                    </div>
                    
                    <Link 
                      href={thread.category ? `/collab/community/${thread.category}/${thread.id}` : `/collab/community/${thread.id}`}
                      className="block mt-1 font-medium text-sm hover:text-primary hover:underline"
                    >
                      {thread.title}
                    </Link>
                    
                    {thread.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {thread.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center text-xs text-muted-foreground gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{viewCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{replyCount}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage 
                            src={authorAvatar} 
                            alt={authorName} 
                          />
                          <AvatarFallback className="text-xs">
                            {authorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {authorName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2 pt-1">
        <div className="w-full text-xs text-gray-500 text-right italic">
          Ultima actualizare la: {format(lastUpdated, 'dd.MM.yyyy HH:mm', { locale: ro })}
        </div>
        <div className="w-full flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                <span>Se încarcă...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                <span>Actualizează</span>
              </>
            )}
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/collab/community/new">
                  <Button variant="default" size="sm" className="gap-1">
                    <span className="material-icons text-sm">add</span>
                    Postare Nouă
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Creează o nouă postare în comunitate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
}