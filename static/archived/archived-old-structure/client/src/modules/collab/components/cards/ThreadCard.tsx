import React from 'react';
import { Link } from 'wouter';
import { 
  MessageSquare, 
  Clock, 
  EyeIcon, 
  HeartIcon, 
  HelpCircle, 
  Lightbulb, 
  Bell,
  Users, 
  Calendar,
  BookOpen,
  TagIcon
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Thread, CommunityCategory } from '../../types';

interface ThreadCardProps {
  thread: Thread;
  onClick?: (thread: Thread) => void;
  className?: string;
  showCategory?: boolean; 
  showStats?: boolean;
  showDescription?: boolean;
  showUser?: boolean;
  compact?: boolean;
}

/**
 * Componentă card pentru afișarea unui thread/discuție
 * Folosită în listele de discuții, comunitate și panouri laterale
 */
const ThreadCard: React.FC<ThreadCardProps> = ({ 
  thread, 
  onClick, 
  className = '',
  showCategory = true,
  showStats = true,
  showDescription = true,
  showUser = true,
  compact = false
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(thread);
    }
  };

  const getCategoryColor = (category?: CommunityCategory) => {
    switch (category) {
      case CommunityCategory.ANUNTURI:
        return 'bg-amber-500/20 text-amber-700 border-amber-300';
      case CommunityCategory.INTREBARI:
        return 'bg-blue-500/20 text-blue-700 border-blue-300';
      case CommunityCategory.IDEI:
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-300';
      case CommunityCategory.EVENIMENTE:
        return 'bg-purple-500/20 text-purple-700 border-purple-300';
      case CommunityCategory.RESURSE:
        return 'bg-cyan-500/20 text-cyan-700 border-cyan-300';
      case CommunityCategory.TUTORIALE:
        return 'bg-orange-500/20 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-300';
    }
  };

  const getCategoryIcon = (category?: CommunityCategory) => {
    switch (category) {
      case CommunityCategory.ANUNTURI:
        return <Bell className="h-4 w-4" />;
      case CommunityCategory.INTREBARI:
        return <HelpCircle className="h-4 w-4" />;
      case CommunityCategory.IDEI:
        return <Lightbulb className="h-4 w-4" />;
      case CommunityCategory.EVENIMENTE:
        return <Calendar className="h-4 w-4" />;
      case CommunityCategory.RESURSE:
        return <BookOpen className="h-4 w-4" />;
      case CommunityCategory.TUTORIALE:
        return <BookOpen className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Formatează data relativ (ex: "acum 2 ore")
  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const threadDate = new Date(date);
    const diffSeconds = Math.floor((now.getTime() - threadDate.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'acum câteva secunde';
    if (diffSeconds < 3600) return `acum ${Math.floor(diffSeconds / 60)} minute`;
    if (diffSeconds < 86400) return `acum ${Math.floor(diffSeconds / 3600)} ore`;
    if (diffSeconds < 604800) return `acum ${Math.floor(diffSeconds / 86400)} zile`;
    
    return threadDate.toLocaleDateString('ro-RO');
  };

  // Determină linkul bazat pe categorie
  const getThreadLink = () => {
    if (thread.category) {
      return `/collab/community/${thread.category}/${thread.id}`;
    }
    return `/collab/threads/${thread.id}`;
  };

  return (
    <Card
      className={`hover:border-primary transition-all cursor-pointer ${className} ${
        thread.isPinned ? 'border-l-4 border-l-amber-500' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start gap-3">
          {thread.category && (
            <div className={`flex-shrink-0 p-2 rounded-full ${getCategoryColor(thread.category as CommunityCategory).split(' ')[0]}`}>
              {getCategoryIcon(thread.category as CommunityCategory)}
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <Link 
                href={getThreadLink()} 
                className={`font-medium hover:underline ${compact ? 'text-sm' : 'text-base'}`}
              >
                {thread.title}
              </Link>
              
              {!compact && (
                <div className="text-xs text-muted-foreground">
                  {formatRelativeTime(thread.createdAt || new Date())}
                </div>
              )}
            </div>
            
            {showDescription && thread.description && (
              <p className={`text-muted-foreground line-clamp-2 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                {thread.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {showCategory && thread.category && (
                <Badge className={getCategoryColor(thread.category as CommunityCategory)}>
                  {getCategoryIcon(thread.category as CommunityCategory)}
                  <span className="ml-1 text-xs">{thread.category}</span>
                </Badge>
              )}
              
              {thread.tags && thread.tags.length > 0 && (
                thread.tags.slice(0, compact ? 1 : 3).map((tag, i) => (
                  <Badge key={i} variant="outline" className={`text-xs ${compact ? 'px-1.5 py-0' : ''}`}>
                    {!compact && <TagIcon className="h-2.5 w-2.5 mr-1" />}
                    {tag}
                  </Badge>
                ))
              )}
              
              {showStats && (
                <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                  {thread.viewCount !== undefined && (
                    <div className="flex items-center">
                      <EyeIcon className="h-3 w-3 mr-1" />
                      {thread.viewCount}
                    </div>
                  )}
                  
                  {thread.replyCount !== undefined && (
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {thread.replyCount}
                    </div>
                  )}
                  
                  {thread.likeCount !== undefined && (
                    <div className="flex items-center">
                      <HeartIcon className="h-3 w-3 mr-1" />
                      {thread.likeCount}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {showUser && compact && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatRelativeTime(thread.createdAt || new Date())}
                </div>
                
                {thread.createdBy && (
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {thread.createdBy.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThreadCard;