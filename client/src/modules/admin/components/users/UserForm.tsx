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
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { User, UserFormData, Role } from "../../hooks/useUsers";

interface UserFormProps {
  user?: User;
  roles: Role[];
  onSubmit: (data: UserFormData) => void;
  isPending: boolean;
}

export function UserForm({ user, roles, onSubmit, isPending }: UserFormProps) {
  // Define form validation schema
  const formSchema = z.object({
    email: z.string().email("Adresa de email este invalidă"),
    password: user 
      ? z.string().min(8, "Parola trebuie să aibă minim 8 caractere").optional().or(z.literal(""))
      : z.string().min(8, "Parola trebuie să aibă minim 8 caractere"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    isActive: z.boolean().default(true),
    roles: z.array(z.string()).default([]),
  });

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      isActive: true,
      roles: [],
    },
  });

  // Set form values when user data is available
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        password: "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        isActive: user.isActive ?? true,
        roles: user.roles?.map(role => role.id) || [],
      });
    }
  }, [user, form]);

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const userData: UserFormData = {
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      isActive: values.isActive,
      roles: values.roles,
    };

    // Only include password if it's provided
    if (values.password) {
      userData.password = values.password;
    }

    onSubmit(userData);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="utilizator@exemplu.ro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{user ? "Schimbă parola" : "Parolă"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={user ? "Lasă gol pentru a păstra parola actuală" : "Parolă"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    {user && (
                      <FormDescription>
                        Lasă gol pentru a păstra parola actuală
                      </FormDescription>
                    )}
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prenume</FormLabel>
                    <FormControl>
                      <Input placeholder="Prenume" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume</FormLabel>
                    <FormControl>
                      <Input placeholder="Nume" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Utilizator activ</FormLabel>
                      <FormDescription>
                        Utilizatorii inactivi nu se pot autentifica în sistem
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Roluri</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roles.map((role) => (
                  <FormField
                    key={role.id}
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(role.id)}
                            onCheckedChange={(checked) => {
                              const currentRoles = [...field.value];
                              if (checked) {
                                if (!currentRoles.includes(role.id)) {
                                  field.onChange([...currentRoles, role.id]);
                                }
                              } else {
                                field.onChange(currentRoles.filter(id => id !== role.id));
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{role.name}</FormLabel>
                          {role.description && (
                            <FormDescription>
                              {role.description}
                            </FormDescription>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />
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
                  user ? "Actualizează utilizatorul" : "Adaugă utilizator"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}