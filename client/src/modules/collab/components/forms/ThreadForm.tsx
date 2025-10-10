import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Users,
  Tag,
  Pin,
  UserPlus,
  Calendar,
  Bell
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

import { Thread, CommunityCategory } from '../../types';
import useCollabApi from '../../hooks/useCollabApi';

interface ThreadFormProps {
  thread?: Thread;
  onSubmit: (data: Thread) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  isCommunityThread?: boolean;
}

/**
 * Formular pentru crearea sau editarea unui thread/discuție
 * Suportă atât thread-uri de discuții cât și postări în comunitate
 */
const ThreadForm: React.FC<ThreadFormProps> = ({ 
  thread, 
  onSubmit, 
  onCancel,
  isLoading = false,
  isCommunityThread = false
}) => {
  // TODO: Implementare useUsers și useThreadTags în useCollabApi
  const useUsers = () => ({ data: [], isLoading: false });
  const useThreadTags = () => ({ data: [], isLoading: false });
  
  const [selectedTags, setSelectedTags] = useState<string[]>(
    thread?.tags || []
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    thread?.participants || []
  );
  
  // Obține lista de utilizatori pentru participanți
  const { data: users, isLoading: isLoadingUsers } = useUsers();
  
  // Obține taguri populare pentru thread-uri
  const { data: popularTags, isLoading: isLoadingTags } = useThreadTags();
  
  // Schema de validare pentru formular
  const threadSchema = z.object({
    title: z.string().min(3, 'Titlul trebuie să conțină cel puțin 3 caractere').max(200),
    description: z.string().optional(),
    participants: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    isPrivate: z.boolean(),
    isPinned: z.boolean(),
    category: isCommunityThread 
      ? z.nativeEnum(CommunityCategory).optional()
      : z.string().optional(),
    expiryDate: z.date().optional().nullable(),
  });

  type ThreadFormValues = z.infer<typeof threadSchema>;

  // Inițializarea formularului
  const form = useForm<ThreadFormValues>({
    resolver: zodResolver(threadSchema),
    defaultValues: {
      title: thread?.title || '',
      description: thread?.description || '',
      participants: thread?.participants || [],
      tags: thread?.tags || [],
      isPrivate: thread?.isPrivate ?? false,
      isPinned: thread?.isPinned || false,
      category: thread?.category || (isCommunityThread ? CommunityCategory.ANUNTURI : undefined),
      expiryDate: (thread as any)?.expiryDate ? new Date((thread as any).expiryDate) : null,
    },
  });

  const handleSubmit = (values: ThreadFormValues) => {
    onSubmit({
      id: thread?.id,
      ...values,
      createdAt: thread?.createdAt || new Date(),
      updatedAt: new Date(),
    } as any);
  };

  // Handler pentru adăugarea unui tag
  const handleAddTag = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      form.setValue('tags', newTags);
      setSelectedTags(newTags);
    }
  };

  // Handler pentru eliminarea unui tag
  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    const newTags = currentTags.filter(t => t !== tag);
    form.setValue('tags', newTags);
    setSelectedTags(newTags);
  };

  // Handler pentru adăugarea unui participant
  const handleAddParticipant = (userId: string) => {
    const currentParticipants = form.getValues('participants') || [];
    if (!currentParticipants.includes(userId)) {
      const newParticipants = [...currentParticipants, userId];
      form.setValue('participants', newParticipants);
      setSelectedParticipants(newParticipants);
    }
  };

  // Handler pentru eliminarea unui participant
  const handleRemoveParticipant = (userId: string) => {
    const currentParticipants = form.getValues('participants') || [];
    const newParticipants = currentParticipants.filter(id => id !== userId);
    form.setValue('participants', newParticipants);
    setSelectedParticipants(newParticipants);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titlu*</FormLabel>
              <FormControl>
                <Input 
                  placeholder={`Introduceți titlul ${isCommunityThread ? 'postării' : 'discuției'}`} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descriere</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Descrierea ${isCommunityThread ? 'postării' : 'discuției'}...`}
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isCommunityThread && (
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categorie*</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(CommunityCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Etichete</FormLabel>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        type="button"
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <div>
                  <Input
                    placeholder="Adăugați o etichetă și apăsați Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        if (target.value.trim()) {
                          handleAddTag(target.value.trim());
                          target.value = '';
                        }
                      }
                    }}
                  />
                </div>
                
                {(popularTags?.length || 0) > 0 && (
                  <div className="mt-2">
                    <FormLabel className="text-xs">Etichete populare</FormLabel>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(popularTags || []).map((tag: string) => (
                        <Badge 
                          key={tag} 
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => handleAddTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {!isCommunityThread && (
          <FormField
            control={form.control}
            name="participants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Participanți</FormLabel>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedParticipants.map(userId => {
                      const user = users?.find((u: { id: string; name?: string }) => u.id === userId) as { id: string; name?: string } | undefined;
                      return (
                        <Badge 
                          key={userId} 
                          variant="secondary"
                          className="gap-1 pl-1"
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[10px]">
                              {(user as any)?.name?.substring(0, 2).toUpperCase() || 'UN'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{(user as any)?.name || userId}</span>
                          <button
                            type="button"
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                            onClick={() => handleRemoveParticipant(userId)}
                          >
                            &times;
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                  
                  <Select onValueChange={handleAddParticipant}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Adăugați participanți" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(users || [])
                        .filter((user: { id: string; name?: string }) => !selectedParticipants.includes(user.id))
                        .map((user: { id: string; name?: string }) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>
                                  {user.name?.substring(0, 2).toUpperCase() || 'UN'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{user.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        )}

        {isCommunityThread && (
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Dată expirare (opțional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: ro })
                        ) : (
                          <span>Setați data de expirare</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {field.value ? 'Postarea va expira și va fi arhivată la această dată.' : 
                    'Opțional, setați o dată când anunțul/postarea nu va mai fi relevantă.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isPrivate"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Privat</FormLabel>
                  <FormDescription>
                    {isCommunityThread 
                      ? 'Postarea va fi vizibilă doar pentru participanți.' 
                      : 'Discuția va fi vizibilă doar pentru participanți, nu pentru toți utilizatorii.'}
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPinned"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Fixat</FormLabel>
                  <FormDescription>
                    {isCommunityThread 
                      ? 'Postarea va fi afișată în partea de sus a listei.' 
                      : 'Discuția va fi fixată în partea de sus a listei.'}
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Anulează
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Se salvează...' : thread?.id ? 'Actualizează' : 'Creează'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ThreadForm;