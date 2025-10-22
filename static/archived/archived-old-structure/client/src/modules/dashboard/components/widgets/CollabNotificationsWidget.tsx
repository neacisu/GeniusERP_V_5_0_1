/**
 * Collaboration Notifications Widget
 * 
 * Dashboard widget that displays recent notifications from the collaboration module,
 * including task assignments, mentions, and other important updates.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow, format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'wouter';
import { 
  Bell,
  Loader2,
  CheckCircle,
  ClipboardList,
  MessageSquare,
  AtSign,
  AlarmClock,
  Users,
  RefreshCw,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Define notification types
type NotificationType = 
  | 'task_assigned' 
  | 'task_completed' 
  | 'task_commented' 
  | 'task_due_soon' 
  | 'task_overdue' 
  | 'mention' 
  | 'thread_reply' 
  | 'note_created';

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface CollabNotificationsWidgetProps {
  limit?: number;
}

export default function CollabNotificationsWidget({ limit = 6 }: CollabNotificationsWidgetProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();
  
  // Fetch notifications
  const { data, isLoading, error, refetch: originalRefetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await apiRequest<Notification[] | { error?: string; status?: number; items?: Notification[]; unreadCount?: number }>('/api/collaboration/notifications', {
        method: 'GET',
        params: {
          limit: limit.toString()
        }
      });
      
      console.log('Notifications API response:', result);
      
      // Handle different response formats
      if (result) {
        // Case 1: Response is an object with items array (our API format)
        if (typeof result === 'object' && !Array.isArray(result) && 'items' in result && Array.isArray(result.items)) {
          console.log('Found items array in response:', result.items.length);
          return result.items;
        }
        
        // Case 2: Response is an error object
        if (typeof result === 'object' && 'error' in result) {
          console.warn('Error in notifications response:', result.error);
          return [];
        }
        
        // Case 3: Response is already an array
        if (Array.isArray(result)) {
          return result;
        }
      }
      
      // Default: Return empty array if we can't determine the format
      console.warn('Unrecognized notifications response format:', result);
      return [];
    },
    staleTime: 30000 // 30 seconds
  });
  
  // Custom refetch function that updates the last updated timestamp
  const refetch = async () => {
    const result = await originalRefetch();
    setLastUpdated(new Date());
    toast({
      title: "Actualizare efectuată",
      description: "Notificările au fost actualizate cu succes.",
      variant: "default",
    });
    return result;
  };
  
  // Make sure data is always an array (defensive programming)
  const notifications = Array.isArray(data) ? data : [];
  
  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/api/collaboration/notifications/${id}/read`, {
        method: 'POST'
      });
      refetch();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest('/api/collaboration/notifications/read-all', {
        method: 'POST'
      });
      refetch();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_assigned':
        return <ClipboardList className="h-4 w-4 text-primary" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'task_commented':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'task_due_soon':
        return <AlarmClock className="h-4 w-4 text-yellow-500" />;
      case 'task_overdue':
        return <AlarmClock className="h-4 w-4 text-red-500" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-purple-500" />;
      case 'thread_reply':
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case 'note_created':
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get URL for the notification target
  const getNotificationUrl = (notification: Notification) => {
    switch (notification.targetType) {
      case 'task':
        return `/collab/tasks/${notification.targetId}`;
      case 'thread':
        return `/collab/threads/${notification.targetId}`;
      case 'note':
        return `/collab/notes/${notification.targetId}`;
      default:
        return '/collab';
    }
  };
  
  // Format the notification time
  const formatNotificationTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ro
    });
  };
  
  // Get the notification priority color
  const getNotificationPriorityClass = (type: NotificationType, isRead: boolean) => {
    if (isRead) return 'border-gray-100 bg-white';
    
    switch (type) {
      case 'task_overdue':
        return 'border-red-100 bg-red-50';
      case 'task_due_soon':
        return 'border-yellow-100 bg-yellow-50';
      case 'task_assigned':
      case 'mention':
        return 'border-primary/10 bg-primary/5';
      default:
        return 'border-blue-100 bg-blue-50';
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">Notificări</CardTitle>
            <CardDescription>
              {isLoading ? 'Se încarcă...' : `${notifications.filter(n => !n.isRead).length} necitite din ${notifications.length}`}
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/collab/notifications">
                    <Bell className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Toate Notificările</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vezi toate notificările</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Nu s-au putut încărca notificările.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Încearcă din nou
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nu aveți notificări.</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                  }}
                  className={cn(
                    "border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer",
                    getNotificationPriorityClass(notification.type, notification.isRead)
                  )}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Link 
                          href={getNotificationUrl(notification)}
                          className={cn(
                            "font-medium text-sm hover:text-primary hover:underline",
                            !notification.isRead && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </Link>
                        <time className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatNotificationTime(notification.createdAt)}
                        </time>
                      </div>
                      
                      <p className={cn(
                        "text-xs text-muted-foreground mt-1 line-clamp-2",
                        !notification.isRead && "text-gray-600"
                      )}>
                        {notification.message}
                      </p>
                      
                      {!notification.isRead && (
                        <Badge className="mt-2" variant="secondary">Necitit</Badge>
                      )}
                      
                      {notification.metadata?.sender && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage 
                              src={notification.metadata.senderAvatar} 
                              alt={notification.metadata.senderName} 
                            />
                            <AvatarFallback className="text-xs">
                              {notification.metadata.senderName ? 
                                notification.metadata.senderName.substring(0, 2).toUpperCase() : 
                                'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {notification.metadata.senderName}
                          </span>
                        </div>
                      )}
                    </div>
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
          
          <Button 
            variant="default" 
            size="sm"
            disabled={notifications.filter(n => !n.isRead).length === 0 || isLoading}
            onClick={markAllAsRead}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            <span>Marchează toate ca citite</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}