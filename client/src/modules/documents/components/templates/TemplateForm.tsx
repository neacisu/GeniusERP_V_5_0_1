import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import {
  Save,
  X,
  Template,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define validation schema
const templateSchema = z.object({
  title: z.string().min(3, {
    message: "Titlul trebuie să conțină cel puțin 3 caractere"
  }),
  description: z.string().optional(),
  content: z.string(),
  category: z.string().min(1, {
    message: "Selectați o categorie"
  }),
  tags: z.string(),
  isPublic: z.boolean().default(false)
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  initialData?: Partial<TemplateFormValues>;
  onSubmit: (data: TemplateFormValues) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

/**
 * Template Form Component
 * 
 * Form for creating or editing document templates
 */
const TemplateForm: React.FC<TemplateFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false
}) => {
  const { toast } = useToast();
  
  // Set up form with zod resolver
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: initialData.title || '',
      description: initialData.description || '',
      content: initialData.content || '',
      category: initialData.category || '',
      tags: initialData.tags || '',
      isPublic: initialData.isPublic || false
    }
  });
  
  // Handle form submission
  const handleSubmit = (values: TemplateFormValues) => {
    onSubmit(values);
    
    toast({
      title: isEditing ? "Șablon actualizat" : "Șablon creat",
      description: isEditing 
        ? "Șablonul a fost actualizat cu succes" 
        : "Șablonul a fost creat cu succes",
    });
  };
  
  return (
    <Card className="border">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Editare șablon document" : "Creare șablon document nou"}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titlu</FormLabel>
                  <FormControl>
                    <Input placeholder="Introduceți titlul șablonului" {...field} />
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
                      placeholder="Descriere opțională pentru acest șablon" 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    O scurtă descriere a scopului acestui șablon
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conținut șablon</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Introduceți conținutul șablonului (text sau HTML)" 
                      className="resize-none font-mono"
                      rows={10}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Puteți utiliza variabile precum {"{nume}"}, {"{data}"} care vor fi înlocuite la generarea documentului
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați o categorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="contracts">Contracte</SelectItem>
                        <SelectItem value="invoices">Facturi</SelectItem>
                        <SelectItem value="reports">Rapoarte</SelectItem>
                        <SelectItem value="letters">Scrisori</SelectItem>
                        <SelectItem value="legal">Documente juridice</SelectItem>
                        <SelectItem value="certificates">Certificate</SelectItem>
                        <SelectItem value="other">Altele</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="oficial, important, etc. (separate prin virgulă)" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Etichetele ajută la organizarea și filtrarea șabloanelor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Partajare publică</FormLabel>
                    <FormDescription>
                      Acest șablon va fi vizibil pentru toți utilizatorii
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
          <CardFooter className="flex justify-between">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Anulează
              </Button>
            )}
            
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Actualizează șablon" : "Salvează șablon"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default TemplateForm;