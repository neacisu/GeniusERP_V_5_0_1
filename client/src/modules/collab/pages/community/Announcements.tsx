import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  MessageSquare, 
  Search,
  Bell,
  Pin,
  Calendar,
  Users,
  Plus,
  Filter,
  EyeIcon,
  HeartIcon,
  Clock,
  TagIcon
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

import CollabLayout from '../../components/layout/CollabLayout';
import useCollabApi from '../../hooks/useCollabApi';
import { CommunityCategory } from '../../types';

/**
 * Pagina de Anunțuri din comunitate
 */
function CommunityAnnouncementsPage() {
  const { useCommunityThreads, useCreateCommunityThread } = useCollabApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadDescription, setNewThreadDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [newThreadTags, setNewThreadTags] = useState('');
  
  // Obține anunțuri
  const { data: announcementsResponse, isLoading } = useCommunityThreads({ 
    category: CommunityCategory.ANUNTURI 
  });
  
  // Mutație pentru crearea unui anunț nou
  const { mutate: createThread, isLoading: isCreating } = useCreateCommunityThread();
  
  // Filtrează anunțurile în funcție de căutare
  const filteredAnnouncements = announcementsResponse?.threads.filter(thread => {
    return !searchQuery || 
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (thread.description && thread.description.toLowerCase().includes(searchQuery.toLowerCase()));
  }) || [];
  
  // Grupează anunțurile în pinned (importante) și normale
  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.isPinned);
  
  // Handle pentru crearea unui anunț nou
  const handleCreateAnnouncement = () => {
    if (!newThreadTitle.trim()) return;
    
    const tagsArray = newThreadTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
      
    createThread({
      title: newThreadTitle,
      description: newThreadDescription,
      category: CommunityCategory.ANUNTURI,
      tags: tagsArray,
      isPublic: true,
      isPinned: isImportant,
      companyId: '7196288d-7314-4512-8b67-2c82449b5465' // Acesta ar fi preluat din contextul utilizatorului în aplicația reală
    });
    
    // Reset form și închide dialogul
    setNewThreadTitle('');
    setNewThreadDescription('');
    setIsImportant(false);
    setNewThreadTags('');
    setIsCreateDialogOpen(false);
  };

  return (
    <CollabLayout 
      title="Anunțuri" 
      subtitle="Anunțuri importante și știri pentru echipă" 
      activeTab="community-announcements"
    >
      <div className="space-y-6">
        {/* Header cu căutare și buton pentru anunț nou */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută anunțuri..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Anunț nou
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publicare anunț nou</DialogTitle>
                <DialogDescription>
                  Creează un anunț pentru a informa echipa despre actualizări importante.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Titlu anunț</Label>
                  <Input 
                    id="title" 
                    placeholder="Adaugă un titlu concis și clar" 
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Conținut anunț</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Detalii despre anunț..." 
                    rows={4}
                    value={newThreadDescription}
                    onChange={(e) => setNewThreadDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="important">Marcați ca important</Label>
                    <Switch
                      id="important"
                      checked={isImportant}
                      onCheckedChange={setIsImportant}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anunțurile importante apar la început și sunt evidențiate.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tag-uri (separate prin virgulă)</Label>
                  <Input 
                    id="tags" 
                    placeholder="Ex: important, update, sistem" 
                    value={newThreadTags}
                    onChange={(e) => setNewThreadTags(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Anulează
                </Button>
                <Button 
                  type="button" 
                  onClick={handleCreateAnnouncement} 
                  disabled={!newThreadTitle.trim() || isCreating}
                >
                  {isCreating ? 'Se publică...' : 'Publică anunț'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Anunțuri importante (pinned) */}
        {pinnedAnnouncements.length > 0 && (
          <Card className="border-amber-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Pin className="h-5 w-5 mr-2 text-amber-500" />
                Anunțuri importante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pinnedAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="flex items-start gap-4 pb-4 border-b">
                    <div className="h-10 w-10 flex items-center justify-center bg-amber-100 rounded-full">
                      <Bell className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <Link href={`/collab/community/announcements/${announcement.id}`}>
                        <h3 className="font-medium hover:underline">{announcement.title}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {announcement.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {announcement.tags?.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center text-xs text-muted-foreground gap-3">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            {announcement.viewCount || 0}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {announcement.createdBy?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Anunțuri obișnuite */}
        <Card>
          <CardHeader>
            <CardTitle>Toate anunțurile</CardTitle>
            <CardDescription>
              Anunțuri și actualizări pentru echipă
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              // Skeleton loading
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="w-full space-y-2">
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-14" />
                        <Skeleton className="h-6 w-14" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : regularAnnouncements.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Niciun anunț găsit</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Nu am găsit anunțuri care să corespundă căutării tale.' 
                    : 'Nu există încă anunțuri în această categorie.'}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Creează primul anunț
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {regularAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="flex items-start gap-4 pb-4 border-b">
                    <div className="h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <Link href={`/collab/community/announcements/${announcement.id}`}>
                        <h3 className="font-medium hover:underline">{announcement.title}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {announcement.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {announcement.tags?.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center text-xs text-muted-foreground gap-3">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            {announcement.viewCount || 0}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {announcement.createdBy?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {regularAnnouncements.length > 0 && (
            <CardFooter>
              <Button variant="outline" className="w-full">
                Încarcă mai multe
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </CollabLayout>
  );
};

export default CommunityAnnouncementsPage;