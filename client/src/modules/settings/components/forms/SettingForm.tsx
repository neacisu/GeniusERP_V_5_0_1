/**
 * SettingForm Component
 * 
 * A standardized form component for settings pages with sections and actions
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface SettingFormProps<TFormValues> {
  title: string;
  description?: string;
  form: UseFormReturn<TFormValues>;
  onSubmit: (values: TFormValues) => void;
  children: React.ReactNode;
  isSubmitting?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export default function SettingForm<TFormValues>({
  title,
  description,
  form,
  onSubmit,
  children,
  isSubmitting = false,
  submitText = "Salvează",
  cancelText = "Anulează",
  onCancel,
  className,
  contentClassName,
  footerClassName
}: SettingFormProps<TFormValues>) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className={cn("space-y-6", contentClassName)}>
            {children}
          </CardContent>
          
          <div className={cn(
            "flex items-center justify-end space-x-2 p-6 bg-secondary/10 border-t", 
            footerClassName
          )}>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {cancelText}
              </Button>
            )}
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                submitText
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}