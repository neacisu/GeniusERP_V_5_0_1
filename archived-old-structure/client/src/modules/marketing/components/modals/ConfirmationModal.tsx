/**
 * Marketing Confirmation Modal Component
 * 
 * Reusable confirmation dialog for marketing actions like
 * deleting campaigns, templates, or segments.
 */

import React from "react";
import { AlertTriangle, Info, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ConfirmationType = "delete" | "cancel" | "deactivate" | "activate" | "info";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  description: string;
  type?: ConfirmationType;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  type = "delete",
  confirmLabel,
  cancelLabel = "Anulează",
  isLoading = false,
}) => {
  // Determine icon and button styling based on type
  let Icon = AlertTriangle;
  let iconColor = "text-amber-500";
  let confirmButtonVariant: "destructive" | "default" | "outline" = "destructive";
  let defaultConfirmLabel = "Șterge";
  
  switch (type) {
    case "delete":
      Icon = AlertTriangle;
      iconColor = "text-destructive";
      confirmButtonVariant = "destructive";
      defaultConfirmLabel = "Șterge";
      break;
    case "cancel":
      Icon = X;
      iconColor = "text-amber-500";
      confirmButtonVariant = "destructive";
      defaultConfirmLabel = "Anulează";
      break;
    case "deactivate":
      Icon = X;
      iconColor = "text-amber-500";
      confirmButtonVariant = "outline";
      defaultConfirmLabel = "Dezactivează";
      break;
    case "activate":
      Icon = Check;
      iconColor = "text-green-500";
      confirmButtonVariant = "default";
      defaultConfirmLabel = "Activează";
      break;
    case "info":
      Icon = Info;
      iconColor = "text-blue-500";
      confirmButtonVariant = "default";
      defaultConfirmLabel = "Confirmă";
      break;
  }
  
  // Use provided label or default
  const finalConfirmLabel = confirmLabel || defaultConfirmLabel;
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };
  
  const handleConfirm = () => {
    onConfirm();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex flex-col items-center text-center sm:text-left sm:items-start">
          <div className={`mb-2 ${iconColor}`}>
            <Icon className="h-8 w-8" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="sm:justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Se procesează...
              </>
            ) : (
              finalConfirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;