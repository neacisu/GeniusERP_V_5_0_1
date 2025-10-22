/**
 * Setting Form Modal Component
 * 
 * Reusable modal for settings forms
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface SettingFormModalProps {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  isPending?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showFooter?: boolean;
}

export default function SettingFormModal({
  title,
  description,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  submitLabel = "Salvează",
  cancelLabel = "Anulează",
  children,
  footerContent,
  isPending = false,
  size = "md",
  showFooter = true
}: SettingFormModalProps) {
  const sizeClasses = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-xl",
    xl: "sm:max-w-2xl"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClasses[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <form onSubmit={onSubmit}>
          <div className="py-4">
            {children}
          </div>
          
          {showFooter && (
            <DialogFooter>
              {footerContent ? (
                footerContent
              ) : (
                <>
                  {onCancel && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onCancel}
                      disabled={isPending}
                    >
                      {cancelLabel}
                    </Button>
                  )}
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Se salvează..." : submitLabel}
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}