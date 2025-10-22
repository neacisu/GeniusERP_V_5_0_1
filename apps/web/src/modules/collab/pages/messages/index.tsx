import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  MessageCircle,
  Search,
  Filter,
  Star
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import CollabLayout from '../../components/layout/CollabLayout';
import { MessagesTable } from '../../components/tables';
import useCollabApi from '../../hooks/useCollabApi';
import { Message } from '../../types';

/**
 * Pagina mesajelor
 */
const MessagesPage: React.FC = () => {
  const { useMessages, useStarMessage } = useCollabApi();
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Obține lista de mesaje
  const { data: messagesData, isLoading, isError } = useMessages({
    filter,
    search: searchQuery || undefined,
    refresh: refreshTrigger
  });
  
  // Mutația pentru markarea mesajelor ca favorite
  const starMessageMutation = useStarMessage();
  
  // Handler pentru marcarea ca favorit
  const handleToggleStar = async (messageId: string, isStarred: boolean) => {
    try {
      await starMessageMutation.mutateAsync({ id: messageId, isStarred });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Eroare la marcarea mesajului ca favorit:', error);
    }
  };
  
  // Handler pentru căutare
  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <CollabLayout title="Mesaje" subtitle="Comunicare și notificări" activeTab="messages">
      <div className="space-y-6">
        {/* Header cu acțiuni */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Centru de mesaje</h1>
          
          <form onSubmit={handleSearch} className="w-full md:w-auto flex items-center gap-2">
            <Input
              placeholder="Caută mesaje..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-[250px]"
            />
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
        
        <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="all">Toate mesajele</TabsTrigger>
            <TabsTrigger value="unread">Necitite</TabsTrigger>
            <TabsTrigger value="starred">Favorite</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="border rounded-lg bg-white">
                  <MessagesTable 
                    messages={messagesData?.messages || []}
                    isLoading={isLoading}
                    onStar={handleToggleStar}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="unread" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="border rounded-lg bg-white">
                  <MessagesTable 
                    messages={(messagesData?.messages || []).filter(msg => !msg.isRead)}
                    isLoading={isLoading}
                    onStar={handleToggleStar}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="starred" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="border rounded-lg bg-white">
                  <MessagesTable 
                    messages={(messagesData?.messages || []).filter(msg => msg.isStarred)}
                    isLoading={isLoading}
                    onStar={handleToggleStar}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CollabLayout>
  );
};

export default MessagesPage;

// Importăm aici Card și CardContent pentru a rezolva eroarea 
import {
  Card,
  CardContent
} from "@/components/ui/card";