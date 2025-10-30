/**
 * Marketing Form Actions Component
 * 
 * Standardized form action buttons (save, cancel, etc.) for marketing forms
 * with consistent styling and behavior.
 */

import React from "react";
import { useLocation } from "wouter";
import { Save, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketingFormActionsProps {
  cancelHref?: string;
  cancelLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  isDirty?: boolean;
  resetForm?: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;
  className?: string;
  align?: "start" | "end" | "center" | "between";
}

export const MarketingFormActions: React.FC<MarketingFormActionsProps> = ({
  cancelHref,
  cancelLabel = "Anulează",
  submitLabel = "Salvează",
  isSubmitting = false,
  isDirty = false,
  resetForm,
  onCancel,
  onSubmit,
  className = "",
  align = "end",
}) => {
  const [_, navigate] = useLocation();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (cancelHref) {
      navigate(cancelHref);
    }
  };

  // Determine alignment class
  let alignmentClass = "";
  switch (align) {
    case "start":
      alignmentClass = "justify-start";
      break;
    case "center":
      alignmentClass = "justify-center";
      break;
    case "between":
      alignmentClass = "justify-between";
      break;
    case "end":
    default:
      alignmentClass = "justify-end";
  }

  return (
    <div className={`flex items-center space-x-2 ${alignmentClass} ${className}`}>
      {resetForm && (
        <Button
          type="button"
          variant="outline"
          onClick={resetForm}
          disabled={isSubmitting || !isDirty}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Resetează
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        disabled={isSubmitting}
      >
        <X className="mr-2 h-4 w-4" />
        {cancelLabel}
      </Button>
      <Button
        type={onSubmit ? "button" : "submit"}
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
          <>
            <Save className="mr-2 h-4 w-4" />
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  );
};

export default MarketingFormActions;