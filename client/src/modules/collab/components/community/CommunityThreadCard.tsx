import React, { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { CommunityThread } from '../../hooks/useCollabApi';

interface CommunityThreadCardProps {
  thread: CommunityThread;
  basePath: string;
  statusBadge?: ReactNode;
  extraContent?: ReactNode;
  extraFooter?: ReactNode;
}

/**
 * Reusable community thread card component
 */
const CommunityThreadCard: React.FC<CommunityThreadCardProps> = ({
  thread,
  basePath,
  statusBadge,
  extraContent,
  extraFooter
}) => {
  const [, navigate] = useLocation();

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`${basePath}/${thread.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
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
          </div>
          {statusBadge}
        </div>
      </CardHeader>
      <CardContent>
        <div className="line-clamp-3 mb-4">
          {thread.description || 'Fără descriere'}
        </div>
        
        {extraContent}
        
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
            <span className="text-sm text-muted-foreground">{thread.replyCount || 0} comentarii</span>
          </div>
          {thread.metadata?.likes && (
            <div className="flex items-center space-x-1">
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{thread.metadata.likes} aprecieri</span>
            </div>
          )}
          {thread.metadata?.votes && (
            <div className="flex items-center space-x-1">
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{thread.metadata.votes} voturi</span>
            </div>
          )}
        </div>
        {extraFooter}
      </CardFooter>
    </Card>
  );
};

export default CommunityThreadCard;