import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
  onAddNew?: () => void;
  addNewLabel?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  className,
  actions,
  onAddNew,
  addNewLabel,
}) => {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onAddNew && addNewLabel && (
          <Button onClick={onAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            {addNewLabel}
          </Button>
        )}
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;