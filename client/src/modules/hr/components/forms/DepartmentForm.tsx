import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Save, Users, Building, BriefcaseBusiness, CalendarDays, BadgeCheck } from 'lucide-react';
import { useHrApi } from '../../hooks/useHrApi';
import { useToast } from '@/hooks/use-toast';

// Definim schema de validare pentru departament
const departmentSchema = z.object({
  name: z.string()
    .min(2, { message: 'Numele departamentului trebuie să aibă minim 2 caractere' })
    .max(100, { message: 'Numele departamentului nu poate depăși 100 caractere' }),
  code: z.string()
    .min(1, { message: 'Codul departamentului este obligatoriu' })
    .max(20, { message: 'Codul departamentului nu poate depăși 20 caractere' }),
  description: z.string().optional(),
  budgetAllocated: z.coerce.number()
    .nonnegative({ message: 'Bugetul alocat trebuie să fie un număr pozitiv' })
    .default(0),
  managerId: z.string().optional(),
  parentId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  responsibilityCenter: z.boolean().default(false),
  isCostCenter: z.boolean().default(false)
});

// Definim tipul departamentului bazat pe schema
type DepartmentFormValues = z.infer<typeof departmentSchema>;

// Interfața pentru datele inițiale ale departamentului
interface DepartmentInitialData {
  id?: string;
  name: string;
  code: string;
  description?: string;
  budgetAllocated: number;
  budgetUsed?: number;
  managerId?: string;
  parentId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  responsibilityCenter?: boolean;
  isCostCenter?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Interfața pentru props-urile componentei
interface DepartmentFormProps {
  onSubmit: (data: DepartmentFormValues) => void;
  initialData?: DepartmentInitialData;
  isSubmitting?: boolean;
}

/**
 * Formular pentru crearea și editarea departamentelor
 * 
 * Acest formular permite administratorilor HR să creeze și să editeze
 * departamente cu informații complete inclusiv alocări bugetare și manager.
 */
const DepartmentForm: React.FC<DepartmentFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false
}) => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const { toast } = useToast();

  // Folosim API-ul pentru a obține date despre angajați și alte departamente
  const { useEmployees, useDepartments } = useHrApi();
  
  // Obținem angajații pentru a selecta managerul departamentului
  const { data: employeesResponse } = useEmployees();
  const employees = employeesResponse?.data?.items || [];

  // Obținem departamentele pentru a selecta departamentul părinte
  const { data: departmentsResponse } = useDepartments();
  const departments = departmentsResponse?.data || [];
  
  // Filtru pentru a nu arăta departamentul curent ca opțiune de părinte
  const parentDepartments = departments.filter(d => !initialData?.id || d.id !== initialData.id);

  // Inițializăm formularul cu datele departamentului sau valori implicite
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      description: initialData?.description || '',
      budgetAllocated: initialData?.budgetAllocated || 0,
      managerId: initialData?.managerId || 'null',
      parentId: initialData?.parentId || 'null',
      status: initialData?.status || 'ACTIVE',
      responsibilityCenter: initialData?.responsibilityCenter || false,
      isCostCenter: initialData?.isCostCenter || false
    }
  });
  
  // Manevră formular și trimitere
  const handleSubmit = (values: DepartmentFormValues) => {
    // Convertim valorile "null" la null real
    const formattedValues = {
      ...values,
      managerId: values.managerId === 'null' ? null : values.managerId,
      parentId: values.parentId === 'null' ? null : values.parentId
    };
    
    onSubmit(formattedValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs 
          defaultValue="general" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full mb-4">
            <TabsTrigger value="general" className="flex items-center gap-1.5">
              <Building className="h-4 w-4 mr-2" />
              Informații generale
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-1.5">
              <BriefcaseBusiness className="h-4 w-4 mr-2" />
              Buget și clasificare
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-1.5">
              <Users className="h-4 w-4 mr-2" />
              Management și organizare
            </TabsTrigger>
          </TabsList>
          
          {/* Tab: Informații generale */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Denumire departament</FormLabel>
                    <FormControl>
                      <Input placeholder="Denumire departament" {...field} />
                    </FormControl>
                    <FormDescription>
                      Introduceți denumirea oficială a departamentului
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cod departament</FormLabel>
                    <FormControl>
                      <Input placeholder="Cod departament (ex: HR, FIN, IT)" {...field} />
                    </FormControl>
                    <FormDescription>
                      Codul unic folosit pentru identificarea departamentului
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descriere</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descriere departament și responsabilități..." 
                      className="resize-none min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Descrieți pe scurt departamentul și principalele sale responsabilități
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status departament</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați statusul departamentului" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activ</SelectItem>
                      <SelectItem value="INACTIVE">Inactiv</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Statusul actual al departamentului
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Tab: Buget și clasificare */}
          <TabsContent value="budget" className="space-y-4">
            <FormField
              control={form.control}
              name="budgetAllocated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buget alocat (RON)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '0' : e.target.value;
                        field.onChange(parseFloat(value));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Bugetul alocat departamentului pentru anul financiar curent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="responsibilityCenter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Centru de responsabilitate
                      </FormLabel>
                      <FormDescription>
                        Marchează departamentul ca fiind un centru de responsabilitate cu obiective specifice
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isCostCenter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Centru de cost
                      </FormLabel>
                      <FormDescription>
                        Marchează departamentul ca fiind un centru de cost pentru evidența contabilă
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* Tab: Management și organizare */}
          <TabsContent value="organization" className="space-y-4">
            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager departament</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați managerul departamentului" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">-- Fără manager --</SelectItem>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.lastName} {employee.firstName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Managerul responsabil de conducerea departamentului
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departament părinte</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați departamentul părinte" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">-- Fără departament părinte --</SelectItem>
                      {parentDepartments.map(department => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Departamentul de care aparține în structura organizațională
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            Anulează
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Se salvează...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {initialData ? 'Actualizează departament' : 'Salvează departament'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DepartmentForm;