/**
 * FormSection Component
 * 
 * A section within a form with title, description and organized fields
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  showSeparator?: boolean;
}

export default function FormSection({
  title,
  description,
  children,
  className,
  columns = 1,
  showSeparator = true
}: FormSectionProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={cn("space-y-4", className)}>
      {showSeparator && <Separator className="my-6" />}
      
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className={cn("grid gap-4", gridCols[columns])}>
        {children}
      </div>
    </div>
  );
}