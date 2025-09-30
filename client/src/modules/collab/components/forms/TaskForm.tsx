import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Calendar as CalendarIcon, 
  Clock,
  Users,
  Tag,
  CheckSquare,
  Link as LinkIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { Task, TaskStatus, TaskPriority } from '../../types';
import useCollabApi from '../../hooks/useCollabApi';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: Task) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

/**
 * Formular pentru crearea sau editarea unei sarcini
 */
const TaskForm: React.FC<TaskFormProps> = ({ 
  task, 
  onSubmit, 
  onCancel,
  isLoading = false 
}) => {
  const { useUsers, useTaskTags } = useCollabApi();
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    task?.assignedTo ? [task.assignedTo] : []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    task?.tags || []
  );
  
  // Obține lista de utilizatori pentru atribuire
  const { data: users, isLoading: isLoadingUsers } = useUsers();
  
  // Obține taguri populare pentru sarcini
  const { data: popularTags, isLoading: isLoadingTags } = useTaskTags();
  
  // Schema de validare pentru formular
  const taskSchema = z.object({
    title: z.string().min(3, 'Titlul trebuie să conțină cel puțin 3 caractere').max(100),
    description: z.string().optional(),
    status: z.nativeEnum(TaskStatus),
    priority: z.nativeEnum(TaskPriority),
    dueDate: z.date().optional().nullable(),
    assignedTo: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    progress: z.number().min(0).max(100).optional(),
    estimatedHours: z.number().min(0).max(100).optional().nullable(),
    isPublic: z.boolean().default(false),
    parentTaskId: z.string().optional().nullable(),
  });

  // Inițializarea formularului
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || TaskStatus.TO_DO,
      priority: task?.priority || TaskPriority.NORMAL,
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      assignedTo: task?.assignedTo || null,
      tags: task?.tags || [],
      progress: task?.progress || 0,
      estimatedHours: task?.estimatedHours || null,
      isPublic: task?.isPublic || false,
      parentTaskId: task?.parentTaskId || null,
    },
  });

  const handleSubmit = (values: z.infer<typeof taskSchema>) => {
    onSubmit({
      id: task?.id,
      ...values,
      createdAt: task?.createdAt || new Date(),
      updatedAt: new Date(),
    } as Task);
  };

  // Handler pentru selectarea unui user
  const handleSelectUser = (userId: string) => {
    form.setValue('assignedTo', userId);
    setSelectedUsers([userId]);
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
                  placeholder="Introduceți titlul sarcinii" 
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
                  placeholder="Descrierea detaliată a sarcinii..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați statusul" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TaskStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioritate*</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați prioritatea" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TaskPriority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Termen limită</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: ro })
                        ) : (
                          <span>Selectați data</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timp estimat (ore)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Număr de ore"
                    min={0}
                    max={100}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atribuire</FormLabel>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUsers.map(userId => {
                    const user = users?.find(u => u.id === userId);
                    return (
                      <Badge 
                        key={userId} 
                        variant="secondary"
                        className="gap-1 pl-1"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[10px]">
                            {user?.name?.substring(0, 2).toUpperCase() || 'UN'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user?.name || userId}</span>
                        <button
                          type="button"
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                          onClick={() => {
                            setSelectedUsers([]);
                            field.onChange(null);
                          }}
                        >
                          &times;
                        </button>
                      </Badge>
                    );
                  })}
                </div>
                
                {selectedUsers.length === 0 && (
                  <Select 
                    onValueChange={handleSelectUser}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Atribuiți utilizatorului" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(users || []).map(user => (
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
                )}
                <FormMessage />
              </div>
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
                
                {(popularTags?.length || 0) > 0 && (
                  <div className="mt-2">
                    <FormLabel className="text-xs">Etichete populare</FormLabel>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(popularTags || []).map(tag => (
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

        <FormField
          control={form.control}
          name="progress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Progres: {field.value}%</FormLabel>
              <FormControl>
                <Slider
                  defaultValue={[field.value || 0]}
                  max={100}
                  step={5}
                  onValueChange={(values) => field.onChange(values[0])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                <FormLabel>Sarcină publică</FormLabel>
                <FormDescription>
                  Această sarcină va fi vizibilă pentru toți utilizatorii.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

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
            {isLoading ? 'Se salvează...' : task?.id ? 'Actualizează sarcina' : 'Creează sarcina'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TaskForm;