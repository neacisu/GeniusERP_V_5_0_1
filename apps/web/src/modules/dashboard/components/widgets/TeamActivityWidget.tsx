/**
 * Team Activity Widget
 * 
 * Dashboard widget that displays recent activity from the collaboration module,
 * including task assignments, status changes, new threads, and notes.
 */

import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow, format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  Users, 
  Loader2, 
  MessageSquare, 
  ClipboardList, 
  FileText, 
  BarChart,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ActivityType = 'task' | 'note' | 'thread' | 'message';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  targetId: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface TeamActivityWidgetProps {
  limit?: number;
}

export default function TeamActivityWidget({ limit = 7 }: TeamActivityWidgetProps) {
  const [filter, setFilter] = useState<'all' | 'tasks' | 'threads' | 'notes'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();
  
  // Fetch recent team activity
  const { data, isLoading, error, refetch: originalRefetch } = useQuery({
    queryKey: ['team-activity'],
    queryFn: async () => {
      const result = await apiRequest<Activity[] | { error: string; status: number; items: Activity[] }>('/api/collaboration/activity', {
        method: 'GET',
        params: {
          limit: limit.toString(),
          type: filter !== 'all' ? filter : undefined
        }
      });
      
      // Handle the case when we get our error structure instead of an array
      if (result && 'error' in result && 'status' in result) {
        // Return the items array from our error structure or an empty array
        return result.items || [];
      }
      
      return result;
    },
    staleTime: 60000 // 1 minute
  });
  
  // Custom refetch function that updates the last updated timestamp
  const refetch = async () => {
    const result = await originalRefetch();
    setLastUpdated(new Date());
    toast({
      title: "Actualizare efectuată",
      description: "Activitățile echipei au fost actualizate cu succes.",
      variant: "default",
    });
    return result;
  };
  
  // Filter activities based on the selected filter
  const filterActivities = (activities: Activity[]) => {
    if (!activities) return [];
    
    if (filter === 'all') return activities;
    
    if (filter === 'tasks') {
      return activities.filter(a => a.type === 'task');
    } else if (filter === 'threads') {
      return activities.filter(a => a.type === 'thread' || a.type === 'message');
    } else if (filter === 'notes') {
      return activities.filter(a => a.type === 'note');
    }
    
    return activities;
  };
  
  // Make sure data is always an array before filtering
  const activityData = Array.isArray(data) ? data : [];
  const activities = filterActivities(activityData);
  
  // Get activity icon based on type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'task':
        return <ClipboardList className="h-4 w-4 text-primary" />;
      case 'note':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'thread':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      default:
        return <BarChart className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get URL for the activity target
  const getActivityUrl = (activity: Activity) => {
    switch (activity.type) {
      case 'task':
        return `/collab/tasks/${activity.targetId}`;
      case 'note':
        return `/collab/notes/${activity.targetId}`;
      case 'thread':
        return `/collab/threads/${activity.targetId}`;
      case 'message':
        return `/collab/threads/${activity.metadata?.['threadId'] || ''}`;
      default:
        return '/collab';
    }
  };
  
  // Format the activity time
  const formatActivityTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ro
    });
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">Activitatea Echipei</CardTitle>
            <CardDescription>
              {isLoading ? 'Se încarcă...' : `${activities.length} activități recente`}
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/collab">
                    <Users className="h-4 w-4 mr-1" /> 
                    <span className="hidden sm:inline">Colaborare</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Deschide modulul de colaborare</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <div className="px-4 pb-2">
        <Tabs defaultValue="all" value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">Toate</TabsTrigger>
            <TabsTrigger value="tasks">Sarcini</TabsTrigger>
            <TabsTrigger value="threads">Discuții</TabsTrigger>
            <TabsTrigger value="notes">Notițe</TabsTrigger>
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
            <p>Nu s-au putut încărca activitățile.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Încearcă din nou
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nu există activități recente.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4 relative">
              {/* Timeline connector */}
              <div className="absolute w-[2px] bg-gray-100 left-[16px] top-[16px] bottom-4 z-0"></div>
              
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 relative z-10">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border border-white bg-white flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                          <AvatarFallback className="text-xs">
                            {activity.userName.split(' ').map(name => name[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{activity.userName}</span>
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {formatActivityTime(activity.createdAt)}
                      </time>
                    </div>
                    
                    <div className="mt-1">
                      <Link 
                        href={getActivityUrl(activity)}
                        className="text-sm hover:text-primary hover:underline"
                      >
                        {activity.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    </div>
                    
                    {activity.metadata?.['tags'] && activity.metadata['tags'].length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {activity.metadata['tags'].slice(0, 3).map((tag: string, i: number) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-xs py-0 px-1.5 bg-gray-50"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {activity.metadata['tags'].length > 3 && (
                          <Badge 
                            variant="outline" 
                            className="text-xs py-0 px-1.5 bg-gray-50"
                          >
                            +{activity.metadata['tags'].length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2 pt-1">
        <div className="w-full text-xs text-gray-500 text-right italic">
          Ultima actualizare la: {format(lastUpdated, 'dd.MM.yyyy HH:mm', { locale: ro })}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
          className="w-full"
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
      </CardFooter>
    </Card>
  );
}