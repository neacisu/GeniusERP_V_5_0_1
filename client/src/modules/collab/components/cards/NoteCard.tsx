import React from 'react';
import { Link } from 'wouter';
import { 
  FileText, 
  Clock, 
  Tag, 
  Paperclip,
  CheckCircle,
  LinkIcon
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Note } from '../../types';

interface NoteCardProps {
  note: Note;
  onClick?: (note: Note) => void;
  className?: string;
  showCreator?: boolean;
  showRelated?: boolean;
  compact?: boolean;
}

/**
 * Componentă card pentru afișarea unei notițe
 * Folosită în listele de notițe și panouri laterale
 */
const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onClick, 
  className = '',
  showCreator = true,
  showRelated = true,
  compact = false
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(note);
    }
  };

  // Formatează data relativ (ex: "acum 2 ore")
  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffSeconds = Math.floor((now.getTime() - noteDate.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'acum câteva secunde';
    if (diffSeconds < 3600) return `acum ${Math.floor(diffSeconds / 60)} minute`;
    if (diffSeconds < 86400) return `acum ${Math.floor(diffSeconds / 3600)} ore`;
    if (diffSeconds < 604800) return `acum ${Math.floor(diffSeconds / 86400)} zile`;
    
    return noteDate.toLocaleDateString('ro-RO');
  };

  // Extrage primele câteva rânduri din conținut pentru previzualizare
  const getContentPreview = () => {
    if (!note.content) return '';
    
    // Înlătură markdown-ul sau HTML-ul pentru afișare
    const cleanContent = note.content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*|__|\*|_|~~|`/g, '') // Remove formatting
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
      .replace(/<[^>]*>/g, ''); // Remove HTML tags
    
    return cleanContent.substring(0, compact ? 80 : 200) + (cleanContent.length > (compact ? 80 : 200) ? '...' : '');
  };

  return (
    <Card
      className={`hover:border-primary transition-all cursor-pointer ${className} ${
        note.isPinned ? 'border-l-4 border-l-yellow-500' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-indigo-100">
            <FileText className="h-4 w-4 text-indigo-600" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <Link 
                href={`/collab/notes/${note.id}`} 
                className={`font-medium hover:underline ${compact ? 'text-sm' : 'text-base'}`}
              >
                {note.title}
              </Link>
              
              {!compact && (
                <div className="text-xs text-muted-foreground">
                  {formatRelativeTime(note.createdAt || new Date())}
                </div>
              )}
            </div>
            
            {note.content && (
              <p className={`text-muted-foreground mt-1 ${compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-3'}`}>
                {getContentPreview()}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {note.tags && note.tags.length > 0 && (
                note.tags.slice(0, compact ? 1 : 3).map((tag, i) => (
                  <Badge key={i} variant="outline" className={`text-xs ${compact ? 'px-1.5 py-0' : ''}`}>
                    {!compact && <Tag className="h-2.5 w-2.5 mr-1" />}
                    {tag}
                  </Badge>
                ))
              )}
              
              {note.attachmentCount !== undefined && note.attachmentCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {note.attachmentCount}
                </Badge>
              )}
              
              {note.isPublic && (
                <Badge variant="outline" className="text-xs bg-green-100">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
            
            {showRelated && note.relatedItems && note.relatedItems.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border text-xs">
                <div className="flex items-center text-muted-foreground">
                  <LinkIcon className="h-3 w-3 mr-1" />
                  <span>Asociat cu:</span>
                  <div className="flex flex-wrap gap-1 ml-1">
                    {note.relatedItems.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-1.5 py-0">
                        {item.type === 'task' && (
                          <span>{item.title || `Sarcina #${item.id}`}</span>
                        )}
                        {item.type === 'thread' && (
                          <span>{item.title || `Discuția #${item.id}`}</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {showCreator && compact && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatRelativeTime(note.createdAt || new Date())}
                </div>
                
                {note.createdBy && (
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {note.createdBy.substring(0, 2).toUpperCase()}
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

export default NoteCard;