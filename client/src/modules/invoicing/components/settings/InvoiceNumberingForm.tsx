/**
 * Invoice Numbering Form Component
 * 
 * Form for creating or editing invoice numbering settings.
 */

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { InvoiceNumberingSetting } from "@shared/schema/invoice-numbering.schema";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { X } from "lucide-react";

// Form schema with validation
const formSchema = z.object({
  series: z
    .string()
    .min(1, "Seria este obligatorie")
    .max(10, "Seria poate avea maxim 10 caractere")
    .regex(/^[A-Za-z0-9]+$/, "Seria poate conține doar litere și cifre"),
  description: z.string().max(100, "Descrierea poate avea maxim 100 caractere").optional(),
  nextNumber: z.coerce
    .number()
    .int("Numărul trebuie să fie întreg")
    .min(1, "Numărul trebuie să fie cel puțin 1"),
  prefix: z.string().max(10, "Prefixul poate avea maxim 10 caractere").optional(),
  suffix: z.string().max(10, "Sufixul poate avea maxim 10 caractere").optional(),
  year: z.coerce
    .number()
    .int("Anul trebuie să fie întreg")
    .min(2000, "Anul trebuie să fie cel puțin 2000")
    .max(2100, "Anul trebuie să fie cel mult 2100")
    .optional(),
  warehouseId: z.string().uuid("ID depozit invalid").optional().nullable(),
  franchiseId: z.string().uuid("ID franciză invalid").optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface InvoiceNumberingFormProps {
  setting?: InvoiceNumberingSetting;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  warehouses?: Array<{ id: string; name: string }>;
  franchises?: Array<{ id: string; name: string }>;
}

export function InvoiceNumberingForm({
  setting,
  onSubmit,
  onCancel,
  warehouses = [],
  franchises = [],
}: InvoiceNumberingFormProps) {
  const isEditing = !!setting;

  // Initialize form with default values or existing setting
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      series: setting?.series || "",
      description: setting?.description || "",
      nextNumber: setting?.nextNumber || 1,
      prefix: setting?.prefix || "",
      suffix: setting?.suffix || "",
      year: setting?.year || new Date().getFullYear(),
      warehouseId: setting?.warehouseId || null,
      franchiseId: setting?.franchiseId || null,
      isDefault: setting?.isDefault || false,
      isActive: setting?.isActive !== undefined ? setting.isActive : true,
    },
  });

  // Reset form when setting changes
  useEffect(() => {
    if (setting) {
      form.reset({
        series: setting.series,
        description: setting.description || "",
        nextNumber: setting.nextNumber,
        prefix: setting.prefix || "",
        suffix: setting.suffix || "",
        year: setting.year || new Date().getFullYear(),
        warehouseId: setting.warehouseId || null,
        franchiseId: setting.franchiseId || null,
        isDefault: setting.isDefault,
        isActive: setting.isActive,
      });
    } else {
      form.reset({
        series: "",
        description: "",
        nextNumber: 1,
        prefix: "",
        suffix: "",
        year: new Date().getFullYear(),
        warehouseId: null,
        franchiseId: null,
        isDefault: false,
        isActive: true,
      });
    }
  }, [setting, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="series"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serie factură*</FormLabel>
                <FormControl>
                  <Input
                    placeholder="FDI"
                    disabled={isEditing}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Seria poate conține litere și cifre (ex. FI, FDI24)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Următorul număr*</FormLabel>
                <FormControl>
                  <Input placeholder="1" type="number" min="1" {...field} />
                </FormControl>
                <FormDescription>
                  Numărul de la care vor începe facturile noi
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
                  placeholder="Descriere pentru această serie de facturi"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                O descriere opțională pentru a identifica mai ușor această serie
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="prefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prefix</FormLabel>
                <FormControl>
                  <Input placeholder="PREFIX-" {...field} />
                </FormControl>
                <FormDescription>
                  Text adăugat înaintea numărului
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="suffix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sufix</FormLabel>
                <FormControl>
                  <Input placeholder="-SUFIX" {...field} />
                </FormControl>
                <FormDescription>
                  Text adăugat după număr
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>An</FormLabel>
                <FormControl>
                  <Input
                    placeholder={new Date().getFullYear().toString()}
                    type="number"
                    min="2000"
                    max="2100"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Anul pentru această serie (opțional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-2">
          {warehouses.length > 0 && (
            <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depozit</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // Convertește valoarea "all" în null
                      field.onChange(value === "all" ? null : value);
                    }}
                    defaultValue={field.value || "all"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați un depozit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">Toate depozitele</SelectItem>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Seria va fi utilizată doar pentru acest depozit (opțional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {franchises.length > 0 && (
            <FormField
              control={form.control}
              name="franchiseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Franciză</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // Convertește valoarea "all" în null
                      field.onChange(value === "all" ? null : value);
                    }}
                    defaultValue={field.value || "all"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați o franciză" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">Toate francizele</SelectItem>
                      {franchises.map((franchise) => (
                        <SelectItem key={franchise.id} value={franchise.id}>
                          {franchise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Seria va fi utilizată doar pentru această franciză (opțional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Serie implicită</FormLabel>
                  <FormDescription>
                    Această serie va fi folosită automat pentru facturi noi
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

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Status activ</FormLabel>
                  <FormDescription>
                    Dezactivați pentru a nu mai permite generarea de facturi noi
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
        </div>

        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} type="button">
            <X className="w-4 h-4 mr-2" />
            Anulează
          </Button>
          <Button type="submit">
            {isEditing ? "Salvează modificări" : "Adaugă serie"}
          </Button>
        </div>
      </form>
    </Form>
  );
}