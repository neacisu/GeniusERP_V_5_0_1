import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export const Spinner: React.FC<SpinnerProps> = ({
  className,
  size = "md",
}) => {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn(`animate-spin ${sizeClasses[size]}`, className)}
      aria-hidden="true"
    />
  );
};