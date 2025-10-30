import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Tag,
  Link as LinkIcon,
  FileUp,
  Eye,
  FileText
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Note, Task, Thread } from '../../types';
import useCollabApi from '../../hooks/useCollabApi';

interface NoteFormProps {
  note?: Note;
  onSubmit: (data: Note) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  relatedTaskId?: string;
  relatedThreadId?: string;
}

/**
 * Formular pentru crearea sau editarea unei notițe
 */
const NoteForm: React.FC<NoteFormProps> = ({ 
  note, 
  onSubmit, 
  onCancel,
  isLoading = false,
  relatedTaskId,
  relatedThreadId
}) => {
  const { useNoteTags, useTasks, useThreads } = useCollabApi();
  const [selectedTags, setSelectedTags] = useState<string[]>(
    note?.tags || []
  );
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<
    Array<{id: string, type: 'task' | 'thread', title?: string}>
  >(
    note?.relatedItems || []
  );
  
  // Obține taguri populare pentru notițe
  const { data: popularTags, isLoading: isLoadingTags } = useNoteTags();
  
  // Obține sarcini pentru a le asocia cu notița
  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  
  // Obține discuții pentru a le asocia cu notița
  const { data: threads, isLoading: isLoadingThreads } = useThreads();
  
  // Schema de validare pentru formular
  const noteSchema = z.object({
    title: z.string().min(3, 'Titlul trebuie să conțină cel puțin 3 caractere').max(200),
    content: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean(),
    isPinned: z.boolean(),
  });

  type NoteFormValues = z.infer<typeof noteSchema>;

  // Inițializarea formularului
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title || '',
      content: note?.content || '',
      tags: note?.tags || [],
      isPublic: note?.isPublic || false,
      isPinned: note?.isPinned || false,
    },
  });

  const handleSubmit = (values: z.infer<typeof noteSchema>) => {
    // Adaugă automat sarcinile și thread-urile asociate dacă sunt furnizate
    const relatedItems = [...selectedRelatedItems];
    
    if (relatedTaskId && !relatedItems.some(item => item.id === relatedTaskId && item.type === 'task')) {
      const task = tasks?.tasks.find((t: Task) => t.id === relatedTaskId);
      if (task) {
        relatedItems.push({
          id: relatedTaskId,
          type: 'task',
          title: task.title
        });
      }
    }
    
    if (relatedThreadId && !relatedItems.some(item => item.id === relatedThreadId && item.type === 'thread')) {
      const thread = threads?.threads.find((t: Thread) => t.id === relatedThreadId);
      if (thread) {
        relatedItems.push({
          id: relatedThreadId,
          type: 'thread',
          title: thread.title
        });
      }
    }
    
    onSubmit({
      id: note?.id,
      taskId: note?.taskId || relatedTaskId || '',
      companyId: note?.companyId || '',
      userId: note?.userId || '',
      isPrivate: !values.isPublic,
      ...values,
      relatedItems,
      createdAt: note?.createdAt || new Date(),
      updatedAt: new Date(),
    } as Note);
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
  
  // Handler pentru adăugarea unei sarcini asociate
  const handleAddTask = (taskId: string) => {
    if (!taskId) return;
    
    if (!selectedRelatedItems.some(item => item.id === taskId && item.type === 'task')) {
      const task = tasks?.tasks.find((t: Task) => t.id === taskId);
      if (task) {
        const newRelatedItems = [
          ...selectedRelatedItems,
          {
            id: taskId,
            type: 'task' as const,
            title: task.title
          }
        ];
        setSelectedRelatedItems(newRelatedItems);
      }
    }
  };
  
  // Handler pentru adăugarea unei discuții asociate
  const handleAddThread = (threadId: string) => {
    if (!threadId) return;
    
    if (!selectedRelatedItems.some(item => item.id === threadId && item.type === 'thread')) {
      const thread = threads?.threads.find((t: Thread) => t.id === threadId);
      if (thread) {
        const newRelatedItems = [
          ...selectedRelatedItems,
          {
            id: threadId,
            type: 'thread' as const,
            title: thread.title
          }
        ];
        setSelectedRelatedItems(newRelatedItems);
      }
    }
  };
  
  // Handler pentru eliminarea unui element asociat
  const handleRemoveRelatedItem = (id: string, type: 'task' | 'thread') => {
    const newRelatedItems = selectedRelatedItems.filter(
      item => !(item.id === id && item.type === type)
    );
    setSelectedRelatedItems(newRelatedItems);
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
                  placeholder="Introduceți titlul notiței" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conținut</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Conținutul notiței... (suportă markdown)"
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Puteți utiliza formatarea Markdown pentru a stiliza conținutul.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                
                {(popularTags?.tags?.length || 0) > 0 && (
                  <div className="mt-2">
                    <FormLabel className="text-xs">Etichete populare</FormLabel>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(popularTags?.tags || []).map((tag: string) => (
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

        {/* Secțiunea de asociere cu sarcini și discuții */}
        <div>
          <FormLabel>Asociat cu</FormLabel>
          <FormDescription>
            Puteți asocia această notiță cu sarcini sau discuții existente.
          </FormDescription>
          
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {selectedRelatedItems.map(item => (
              <Badge 
                key={`${item.type}-${item.id}`} 
                variant="secondary"
                className="pl-2"
              >
                {item.type === 'task' ? (
                  <FileText className="h-3 w-3 mr-1 text-blue-500" />
                ) : (
                  <LinkIcon className="h-3 w-3 mr-1 text-indigo-500" />
                )}
                <span>{item.title || `${item.type} #${item.id}`}</span>
                <button
                  type="button"
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                  onClick={() => handleRemoveRelatedItem(item.id, item.type)}
                >
                  &times;
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de sarcini */}
            <div>
              <Select onValueChange={handleAddTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Asociați cu o sarcină" />
                </SelectTrigger>
                <SelectContent>
                  {(tasks?.tasks || [])
                    .filter((task: Task) => !selectedRelatedItems.some(
                      item => item.id === task.id && item.type === 'task')
                    )
                    .map((task: Task) => (
                      <SelectItem key={`task-${task.id}`} value={task.id}>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="truncate">{task.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Selector de discuții */}
            <div>
              <Select onValueChange={handleAddThread}>
                <SelectTrigger>
                  <SelectValue placeholder="Asociați cu o discuție" />
                </SelectTrigger>
                <SelectContent>
                  {(threads?.threads || [])
                    .filter((thread: Thread) => !selectedRelatedItems.some(
                      item => item.id === thread.id && item.type === 'thread')
                    )
                    .map((thread: Thread) => (
                      <SelectItem key={`thread-${thread.id}`} value={thread.id}>
                        <div className="flex items-center">
                          <LinkIcon className="h-4 w-4 mr-2 text-indigo-500" />
                          <span className="truncate">{thread.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Notiță publică</FormLabel>
                  <FormDescription>
                    Această notiță va fi vizibilă pentru toți utilizatorii.
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
                  <FormLabel>Fixată</FormLabel>
                  <FormDescription>
                    Această notiță va fi afișată în partea de sus a listei.
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
            {isLoading ? 'Se salvează...' : note?.id ? 'Actualizează notița' : 'Creează notița'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NoteForm;