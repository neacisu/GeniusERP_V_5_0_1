import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import {
  ArrowLeft,
  MessageCircle,
  User,
  Calendar,
  Reply,
  AlertTriangle,
  Star,
  Clock,
  Eye,
  Archive,
  Trash
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

import CollabLayout from '../../components/layout/CollabLayout';
import useCollabApi from '../../hooks/useCollabApi';

/**
 * Pagina de detalii a unui mesaj
 */
const MessageDetailsPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/collab/messages/:id');
  const collabApi = useCollabApi();
  
  // TODO: Implementare hook-uri pentru message individual și acțiuni
  // Deocamdată stubuite pentru a evita erorile TypeScript
  const useMessage = (id?: string) => ({ 
    data: { content: '', author: '', createdAt: '' } as any, 
    isLoading: false, 
    isError: false 
  });
  const useReplyToMessage = () => ({ 
    mutate: (data: any) => {}, 
    mutateAsync: async (data: any) => {},
    isPending: false 
  });
  const useToggleMessageStar = () => ({ 
    mutate: (data: any) => {},
    mutateAsync: async (data: any) => {},
    isPending: false 
  });
  const useMarkMessageRead = () => ({ 
    mutate: (id: string) => {},
    mutateAsync: async (id: string) => {},
    isPending: false 
  });
  
  const [reply, setReply] = useState('');
  
  const messageId = params?.id;
  
  // Obține detaliile mesajului
  const { data: message, isLoading, isError } = useMessage(messageId);
  
  // Mutația pentru trimiterea unui răspuns
  const replyMessageMutation = useReplyToMessage();
  
  // Mutația pentru marcarea ca favorit
  const toggleStarMutation = useToggleMessageStar();
  
  // Mutația pentru marcarea ca citit
  const markReadMutation = useMarkMessageRead();
  
  // Marchează mesajul ca citit la încărcare
  useEffect(() => {
    if (messageId && message && !message.isRead) {
      markReadMutation.mutate(messageId);
    }
  }, [messageId, message]);
  
  // Handler pentru marcarea ca favorit
  const handleToggleStar = async () => {
    if (message) {
      try {
        await toggleStarMutation.mutateAsync({
          id: messageId,
          isStarred: !message.isStarred
        });
      } catch (error) {
        console.error('Eroare la marcarea mesajului ca favorit:', error);
      }
    }
  };
  
  // Handler pentru trimiterea unui răspuns
  const handleSendReply = async () => {
    if (reply.trim() && messageId) {
      try {
        await replyMessageMutation.mutateAsync({
          messageId,
          content: reply
        });
        setReply('');
      } catch (error) {
        console.error('Eroare la trimiterea răspunsului:', error);
      }
    }
  };
  
  // Dacă se încarcă
  if (isLoading) {
    return (
      <CollabLayout title="Detalii mesaj" subtitle="Se încarcă..." activeTab="messages">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </CollabLayout>
    );
  }
  
  // Dacă există o eroare
  if (isError || !message) {
    return (
      <CollabLayout title="Eroare" subtitle="Mesajul nu a putut fi încărcat" activeTab="messages">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Mesajul nu a putut fi găsit</h2>
              <p className="text-muted-foreground mb-4">
                Mesajul cu ID-ul {messageId} nu există sau nu aveți permisiunile necesare.
              </p>
              <Button onClick={() => navigate('/collab/messages')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi la lista de mesaje
              </Button>
            </div>
          </CardContent>
        </Card>
      </CollabLayout>
    );
  }
  
  return (
    <CollabLayout 
      title={message.subject || 'Mesaj fără subiect'} 
      subtitle="Detalii și conversație" 
      activeTab="messages"
    >
      <div className="space-y-6">
        {/* Butoane acțiuni */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/collab/messages')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la mesaje
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleToggleStar}>
              <Star className={`h-4 w-4 mr-2 ${message.isStarred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
              {message.isStarred ? 'Elimină favorit' : 'Marchează favorit'}
            </Button>
            <Button variant="outline">
              <Archive className="h-4 w-4 mr-2" />
              Arhivează
            </Button>
            <Button variant="destructive">
              <Trash className="h-4 w-4 mr-2" />
              Șterge
            </Button>
          </div>
        </div>
        
        {/* Conținut mesaj */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
              <div>
                <CardTitle className="text-xl">{message.subject || 'Fără subiect'}</CardTitle>
                <CardDescription>
                  De la: {message.sender}
                  {message.threadId && (
                    <span className="ml-2">
                      în <Link href={`/collab/threads/${message.threadId}`} className="text-primary hover:underline">
                        {message.threadTitle || `Discuția #${message.threadId}`}
                      </Link>
                    </span>
                  )}
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-2">
                {message.isStarred && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    Favorit
                  </Badge>
                )}
                <Badge variant={message.isRead ? "outline" : "secondary"}>
                  {message.isRead ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Citit
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Necitit
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback>
                  {message.sender?.substring(0, 2).toUpperCase() || 'UN'}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-4 flex-1">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <p className="font-medium">{message.sender}</p>
                    <p className="text-sm text-muted-foreground">
                      Către: {message.recipients?.join(', ') || 'Tine'}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <Separator />
                
                <div className="prose max-w-none">
                  <p>{message.content}</p>
                </div>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Atașamente</h3>
                    <div className="space-y-2">
                      {message.attachments.map((attachment: { name: string }, index: number) => (
                        <div key={index} className="flex items-center p-2 rounded-md border">
                          <span className="flex-1">{attachment.name}</span>
                          <Button size="sm" variant="ghost">Descarcă</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Răspunsuri */}
        {message.replies && message.replies.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Răspunsuri</h2>
            
            {message.replies.map((reply: { content: string; author?: string; createdAt?: string }, index: number) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {(reply.author || 'Utilizator necunoscut').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{reply.author || 'Utilizator necunoscut'}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Data necunoscută'}
                        </p>
                      </div>
                      
                      <div className="prose max-w-none">
                        <p>{reply.content}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Formular răspuns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Răspunde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Scrieți răspunsul dvs. aici..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={5}
              />
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSendReply} 
                  disabled={!reply.trim() || replyMessageMutation.isPending}
                >
                  {replyMessageMutation.isPending ? (
                    <span>Se trimite...</span>
                  ) : (
                    <>
                      <Reply className="h-4 w-4 mr-2" />
                      <span>Trimite răspuns</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CollabLayout>
  );
};

export default MessageDetailsPage;

// Importuri suplimentare
import { Link } from 'wouter';