import React from 'react';
import { Link } from 'wouter';
import { 
  Bell, 
  Clock, 
  Tag, 
  EyeIcon, 
  HeartIcon,
  MessageCircle,
  Pin,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Thread, CommunityCategory } from '../../types';

interface AnnouncementCardProps {
  announcement: Thread;  // Folosim Thread pentru anunțuri cu CommunityCategory.ANUNTURI
  onClick?: (announcement: Thread) => void;
  className?: string;
  featured?: boolean;
  compact?: boolean;
}

/**
 * Componentă card pentru afișarea unui anunț în comunitate
 * Folosită în secțiunea de anunțuri și pe dashboard
 */
const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ 
  announcement, 
  onClick, 
  className = '',
  featured = false,
  compact = false
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(announcement);
    }
  };

  // Formatează data relativ (ex: "acum 2 ore")
  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const announcementDate = new Date(date);
    const diffSeconds = Math.floor((now.getTime() - announcementDate.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'acum câteva secunde';
    if (diffSeconds < 3600) return `acum ${Math.floor(diffSeconds / 60)} minute`;
    if (diffSeconds < 86400) return `acum ${Math.floor(diffSeconds / 3600)} ore`;
    if (diffSeconds < 604800) return `acum ${Math.floor(diffSeconds / 86400)} zile`;
    
    return announcementDate.toLocaleDateString('ro-RO');
  };

  // Verifică dacă anunțul are dată de expirare și dacă este în viitor
  const hasValidExpiryDate = () => {
    if (!announcement.expiryDate) return false;
    const expiryDate = new Date(announcement.expiryDate);
    return expiryDate > new Date();
  };

  // Formatează data de expirare
  const formatExpiryDate = () => {
    if (!announcement.expiryDate) return null;
    
    const expiryDate = new Date(announcement.expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return null;
    if (diffDays === 1) return "Expiră mâine";
    if (diffDays < 7) return `Expiră în ${diffDays} zile`;
    
    return `Expiră pe ${expiryDate.toLocaleDateString('ro-RO')}`;
  };
  
  const expiryText = formatExpiryDate();
  const bgColorClass = featured ? 'bg-amber-50' : '';
  const borderClass = announcement.isPinned ? 'border-l-4 border-l-amber-500' : '';

  return (
    <Card
      className={`hover:border-primary transition-all cursor-pointer ${className} ${bgColorClass} ${borderClass}`}
      onClick={handleClick}
    >
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 p-2 rounded-full ${featured ? 'bg-amber-100' : 'bg-amber-50'}`}>
            <Bell className={`h-4 w-4 ${featured ? 'text-amber-600' : 'text-amber-500'}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Link 
                  href={`/collab/community/announcements/${announcement.id}`} 
                  className={`font-medium hover:underline ${compact ? 'text-sm' : featured ? 'text-lg' : 'text-base'}`}
                >
                  {announcement.title}
                </Link>
                {announcement.isPinned && !compact && (
                  <Pin className="h-3 w-3 text-amber-500" />
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {formatRelativeTime(announcement.createdAt || new Date())}
              </div>
            </div>
            
            {announcement.description && (
              <p className={`text-muted-foreground mt-1 ${compact ? 'text-xs line-clamp-1' : featured ? 'text-sm line-clamp-4' : 'text-sm line-clamp-2'}`}>
                {announcement.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {announcement.tags && announcement.tags.length > 0 && (
                announcement.tags.slice(0, compact ? 1 : 3).map((tag, i) => (
                  <Badge key={i} variant="outline" className={`text-xs ${compact ? 'px-1.5 py-0' : ''}`}>
                    {!compact && <Tag className="h-2.5 w-2.5 mr-1" />}
                    {tag}
                  </Badge>
                ))
              )}
              
              {expiryText && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                  <Calendar className="h-3 w-3 mr-1" />
                  {expiryText}
                </Badge>
              )}
              
              <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                {announcement.viewCount !== undefined && (
                  <div className="flex items-center">
                    <EyeIcon className="h-3 w-3 mr-1" />
                    {announcement.viewCount}
                  </div>
                )}
                
                {announcement.replyCount !== undefined && (
                  <div className="flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {announcement.replyCount}
                  </div>
                )}
              </div>
            </div>
            
            {!compact && (
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
                <div className="flex items-center text-xs text-muted-foreground">
                  {announcement.createdBy && (
                    <>
                      <span>Publicat de </span>
                      <Avatar className="h-5 w-5 mx-1">
                        <AvatarFallback className="text-[10px]">
                          {announcement.createdBy.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{announcement.createdBy}</span>
                    </>
                  )}
                </div>
                
                {featured && (
                  <Link 
                    href={`/collab/community/announcements/${announcement.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Citește anunțul
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementCard;