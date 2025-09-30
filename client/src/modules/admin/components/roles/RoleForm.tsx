import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search } from "lucide-react";
import { Role, Permission } from "../../hooks/useUsers";
import { RoleFormData } from "../../hooks/useRoles";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useState } from "react";

interface RoleFormProps {
  role?: Role;
  permissions: Permission[];
  onSubmit: (data: RoleFormData) => void;
  isPending: boolean;
}

export function RoleForm({ role, permissions, onSubmit, isPending }: RoleFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Define form validation schema
  const formSchema = z.object({
    name: z.string().min(2, "Numele trebuie să aibă minim 2 caractere"),
    description: z.string().optional(),
    permissions: z.array(z.string()).default([]),
  });

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  // Set form values when role data is available
  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description || "",
        // Folosim un array gol deoarece permissions nu există direct pe role
        permissions: [],
      });
    }
  }, [role, form]);

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const roleData: RoleFormData = {
      name: values.name,
      description: values.description,
      permissions: values.permissions,
    };

    onSubmit(roleData);
  };
  
  // Filter permissions based on search query
  const filteredPermissions = permissions.filter(permission => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      permission.name.toLowerCase().includes(query) ||
      (permission.description && permission.description.toLowerCase().includes(query)) ||
      (permission.module && permission.module.toLowerCase().includes(query))
    );
  });
  
  // Group permissions by module
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    const module = permission.module || "Altele";
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
  
  // Sort modules
  const sortedModules = Object.keys(groupedPermissions).sort();
  
  const isSystemRole = role?.name === 'admin' || role?.name === 'user';

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume rol</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nume rol" 
                        {...field} 
                        disabled={isSystemRole}
                      />
                    </FormControl>
                    <FormMessage />
                    {isSystemRole && (
                      <FormDescription>
                        Rolurile de sistem nu pot fi redenumite
                      </FormDescription>
                    )}
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
                        placeholder="Descriere rol" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Permisiuni</h3>
                
                <div className="w-[250px] relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Caută permisiuni..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                {sortedModules.map((module) => (
                  <div key={module}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">{module}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupedPermissions[module].map((permission) => (
                        <FormField
                          key={permission.id}
                          control={form.control}
                          name="permissions"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(permission.id)}
                                  onCheckedChange={(checked) => {
                                    const currentPermissions = [...field.value];
                                    if (checked) {
                                      if (!currentPermissions.includes(permission.id)) {
                                        field.onChange([...currentPermissions, permission.id]);
                                      }
                                    } else {
                                      field.onChange(currentPermissions.filter(id => id !== permission.id));
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>{permission.name}</FormLabel>
                                {permission.description && (
                                  <FormDescription>
                                    {permission.description}
                                  </FormDescription>
                                )}
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-start">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  role ? "Actualizează rolul" : "Adaugă rol"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}