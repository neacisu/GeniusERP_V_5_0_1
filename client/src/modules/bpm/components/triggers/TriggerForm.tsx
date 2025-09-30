/**
 * Trigger Form Component
 * 
 * Componentă pentru crearea și editarea trigger-elor
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Clock, Zap, Webhook, Mail, Play, Save, X } from 'lucide-react';

// Form schema
const triggerFormSchema = z.object({
  name: z.string().min(3, {
    message: 'Numele trebuie să conțină cel puțin 3 caractere.',
  }),
  description: z.string().optional(),
  type: z.enum(['schedule', 'event', 'webhook', 'email', 'manual']),
  isActive: z.boolean().default(true),
  processId: z.string().min(1, {
    message: 'Selectați un proces.',
  }),
  // Schedule specific fields
  cronExpression: z.string().optional(),
  scheduleType: z.enum(['once', 'recurring']).optional(),
  scheduledDate: z.string().optional(),
  // Webhook specific fields
  webhookPath: z.string().optional(),
  webhookMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
  // Event specific fields
  eventSource: z.string().optional(),
  eventType: z.string().optional(),
  // Email specific fields
  emailSubject: z.string().optional(),
  emailFrom: z.string().optional(),
});

export interface Process {
  id: string;
  name: string;
}

export interface TriggerFormProps {
  processes: Process[];
  initialValues?: any;
  onSubmit: (data: z.infer<typeof triggerFormSchema>) => void;
  onCancel: () => void;
}

const TriggerForm: React.FC<TriggerFormProps> = ({
  processes,
  initialValues,
  onSubmit,
  onCancel
}) => {
  // Initialize form with default values or initial values
  const form = useForm<z.infer<typeof triggerFormSchema>>({
    resolver: zodResolver(triggerFormSchema),
    defaultValues: initialValues || {
      name: '',
      description: '',
      type: 'schedule',
      isActive: true,
      processId: '',
      scheduleType: 'recurring',
      cronExpression: '0 0 * * *', // Daily at midnight
      webhookMethod: 'POST',
    },
  });
  
  const triggerType = form.watch('type');
  
  // Handle form submission
  const handleSubmit = (values: z.infer<typeof triggerFormSchema>) => {
    onSubmit(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Informații de bază</CardTitle>
              <CardDescription>
                Configurați informațiile generale pentru acest trigger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume trigger</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduceți un nume descriptiv..." {...field} />
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
                        placeholder="Descrieți scopul acestui trigger..." 
                        className="resize-none" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="processId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proces asociat</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați un proces" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {processes.map((process) => (
                          <SelectItem key={process.id} value={process.id}>
                            {process.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Procesul care va fi declanșat de acest trigger
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Status trigger</FormLabel>
                      <FormDescription>
                        Activați sau dezactivați acest trigger
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Trigger Type Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Tip Trigger</CardTitle>
              <CardDescription>
                Selectați tipul de trigger și configurați parametrii specifici
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip trigger</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <FormItem className="flex flex-col space-y-1">
                          <FormControl>
                            <RadioGroupItem value="schedule" className="sr-only peer" />
                          </FormControl>
                          <div className="flex items-center justify-between rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Programat</FormLabel>
                              <FormDescription className="text-xs">
                                Declanșat la un moment specific
                              </FormDescription>
                            </div>
                            <Clock className="h-5 w-5 text-blue-500" />
                          </div>
                        </FormItem>
                        
                        <FormItem className="flex flex-col space-y-1">
                          <FormControl>
                            <RadioGroupItem value="event" className="sr-only peer" />
                          </FormControl>
                          <div className="flex items-center justify-between rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Eveniment</FormLabel>
                              <FormDescription className="text-xs">
                                Declanșat de un eveniment
                              </FormDescription>
                            </div>
                            <Zap className="h-5 w-5 text-amber-500" />
                          </div>
                        </FormItem>
                        
                        <FormItem className="flex flex-col space-y-1">
                          <FormControl>
                            <RadioGroupItem value="webhook" className="sr-only peer" />
                          </FormControl>
                          <div className="flex items-center justify-between rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Webhook</FormLabel>
                              <FormDescription className="text-xs">
                                Declanșat de un apel HTTP
                              </FormDescription>
                            </div>
                            <Webhook className="h-5 w-5 text-purple-500" />
                          </div>
                        </FormItem>
                        
                        <FormItem className="flex flex-col space-y-1">
                          <FormControl>
                            <RadioGroupItem value="email" className="sr-only peer" />
                          </FormControl>
                          <div className="flex items-center justify-between rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email</FormLabel>
                              <FormDescription className="text-xs">
                                Declanșat de un email
                              </FormDescription>
                            </div>
                            <Mail className="h-5 w-5 text-green-500" />
                          </div>
                        </FormItem>
                        
                        <FormItem className="flex flex-col space-y-1">
                          <FormControl>
                            <RadioGroupItem value="manual" className="sr-only peer" />
                          </FormControl>
                          <div className="flex items-center justify-between rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Manual</FormLabel>
                              <FormDescription className="text-xs">
                                Declanșat manual de utilizator
                              </FormDescription>
                            </div>
                            <Play className="h-5 w-5 text-gray-500" />
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Schedule Type Configuration */}
              {triggerType === 'schedule' && (
                <div className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="scheduleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tip programare</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectați tipul de programare" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="once">O singură dată</SelectItem>
                            <SelectItem value="recurring">Recurent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('scheduleType') === 'recurring' && (
                    <FormField
                      control={form.control}
                      name="cronExpression"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expresie CRON</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="0 0 * * *" />
                          </FormControl>
                          <FormDescription>
                            Expresie CRON pentru programarea recurentă (e.g. 0 0 * * * = zilnic la miezul nopții)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {form.watch('scheduleType') === 'once' && (
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data și ora programată</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
              
              {/* Webhook Configuration */}
              {triggerType === 'webhook' && (
                <div className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="webhookPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cale webhook</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="/api/hooks/my-process" />
                        </FormControl>
                        <FormDescription>
                          Calea la care va fi disponibil webhook-ul (e.g. /api/hooks/my-process)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="webhookMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metodă HTTP</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectați metoda HTTP" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Event Configuration */}
              {triggerType === 'event' && (
                <div className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="eventSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sursă eveniment</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="sistem.subsistem" />
                        </FormControl>
                        <FormDescription>
                          Sursa evenimentului (e.g. accounting.invoice, sales.order)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tip eveniment</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="created" />
                        </FormControl>
                        <FormDescription>
                          Tipul evenimentului (e.g. created, updated, deleted)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Email Configuration */}
              {triggerType === 'email' && (
                <div className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="emailSubject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subiect email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="[PROCESS]" />
                        </FormControl>
                        <FormDescription>
                          Subiectul emailului care va declanșa procesul (poate fi un pattern)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emailFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expeditor email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="user@example.com" />
                        </FormControl>
                        <FormDescription>
                          Adresa expeditorului (poate fi un pattern, e.g. *@example.com)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Manual Trigger has no specific configuration */}
              {triggerType === 'manual' && (
                <div className="pt-4">
                  <div className="rounded-md bg-blue-50 dark:bg-blue-950/50 p-4 text-sm text-blue-600 dark:text-blue-400">
                    <p>
                      Triggerul manual nu necesită configurație suplimentară. 
                      Procesul va putea fi declanșat manual de către utilizatori cu permisiunile necesare.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Anulează
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Salvează Trigger
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TriggerForm;