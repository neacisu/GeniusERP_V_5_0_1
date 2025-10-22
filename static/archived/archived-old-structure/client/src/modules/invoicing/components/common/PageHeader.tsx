/**
 * Page Header Component
 * 
 * A reusable header component for consistent page headings across the invoicing module.
 */

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className,
  onAddNew,
  addNewLabel,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onAddNew && addNewLabel && (
          <button
            onClick={onAddNew}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <span className="material-icons text-sm mr-1">add</span>
            {addNewLabel}
          </button>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;