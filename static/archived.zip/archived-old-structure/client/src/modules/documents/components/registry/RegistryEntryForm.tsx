/**
 * Registry Entry Form Component
 * 
 * Form for creating and editing registry entries with validation.
 */

import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

// Registry entry form schema
const registryEntrySchema = z.object({
  subject: z.string().min(3, {
    message: 'Subiectul trebuie să conțină cel puțin 3 caractere',
  }),
  type: z.string({
    message: 'Alegeți tipul documentului',
  }),
  flow: z.enum(['incoming', 'outgoing'], {
    message: 'Selectați fluxul documentului',
  }),
  sender: z.string().min(2, {
    message: 'Expeditorul trebuie să conțină cel puțin 2 caractere',
  }),
  recipient: z.string().min(2, {
    message: 'Destinatarul trebuie să conțină cel puțin 2 caractere',
  }),
  date: z.date({
    message: 'Selectați data documentului',
  }),
  refNumber: z.string().optional(),
  notes: z.string().optional(),
  documentId: z.string().optional(),
});

type RegistryEntryFormValues = z.infer<typeof registryEntrySchema>;

interface RegistryEntryFormProps {
  defaultValues?: Partial<RegistryEntryFormValues>;
  onSubmit: (values: RegistryEntryFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function RegistryEntryForm({
  defaultValues = {
    flow: 'incoming',
    type: 'letter',
    date: new Date(),
  },
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RegistryEntryFormProps) {
  const [selectedDocumentName, setSelectedDocumentName] = useState<string | null>(null);

  const form = useForm<RegistryEntryFormValues>({
    resolver: zodResolver(registryEntrySchema),
    defaultValues,
  });

  // Handle document selection (in a real app this would open a document picker)
  const handleSelectDocument = () => {
    // Simulated document selection
    setSelectedDocumentName('Document_selectat.pdf');
    form.setValue('documentId', 'doc-123456');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Flow Type */}
          <FormField
            control={form.control}
            name="flow"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tip flux</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați tipul de flux" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="incoming">Intrare</SelectItem>
                    <SelectItem value="outgoing">Ieșire</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Document Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tip document</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați tipul documentului" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="letter">Adresă/Scrisoare</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="invoice">Factură</SelectItem>
                    <SelectItem value="decision">Decizie</SelectItem>
                    <SelectItem value="offer">Ofertă</SelectItem>
                    <SelectItem value="other">Altele</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Subject */}
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Subiect</FormLabel>
                <FormControl>
                  <Input placeholder="Introduceți subiectul documentului" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sender */}
          <FormField
            control={form.control}
            name="sender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {form.watch('flow') === 'incoming' ? 'Expeditor' : 'Emitent'}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      form.watch('flow') === 'incoming'
                        ? 'Denumire expeditor'
                        : 'Departament emitent'
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Recipient */}
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destinatar</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      form.watch('flow') === 'incoming'
                        ? 'Departament destinatar'
                        : 'Denumire destinatar'
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data documentului</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: ro })
                        ) : (
                          <span>Alegeți data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reference Number */}
          <FormField
            control={form.control}
            name="refNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Număr de referință</FormLabel>
                <FormControl>
                  <Input placeholder="Număr de referință extern (opțional)" {...field} />
                </FormControl>
                <FormDescription>
                  Numărul documentului inițial sau de referință
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Document ID */}
          <FormField
            control={form.control}
            name="documentId"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Document</FormLabel>
                <div className="flex space-x-2 items-center">
                  <FormControl>
                    <Input
                      placeholder="ID document (opțional)"
                      {...field}
                      readOnly
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectDocument}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Selectează
                  </Button>
                </div>
                {selectedDocumentName && (
                  <FormDescription>
                    Document selectat: {selectedDocumentName}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Observații</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observații sau notițe (opțional)"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Anulează
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Se procesează...' : 'Înregistrează'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default RegistryEntryForm;