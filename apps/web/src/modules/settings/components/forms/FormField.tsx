/**
 * FormField Component
 * 
 * A wrapper for form fields with consistent styling and layout
 */

import React from "react";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface CustomFormFieldProps {
  name: string;
  label?: string;
  description?: string;
  form: UseFormReturn<any>;
  children: React.ReactNode;
  className?: string;
}

export default function CustomFormField({
  name,
  label,
  description,
  form,
  children,
  className
}: CustomFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>{React.cloneElement(children as React.ReactElement, { ...field })}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}