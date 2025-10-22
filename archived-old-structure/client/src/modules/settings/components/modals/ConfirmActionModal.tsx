/**
 * ConfirmActionModal Component
 * 
 * A reusable confirmation dialog for dangerous or important actions
 */

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "warning";
  isLoading?: boolean;
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmă",
  cancelLabel = "Anulează",
  variant = "default",
  isLoading = false
}: ConfirmActionModalProps) {
  // Conditional styles based on variant
  const getButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-600 hover:bg-red-700";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600";
      default:
        return "";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className={getButtonClass()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se procesează...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}