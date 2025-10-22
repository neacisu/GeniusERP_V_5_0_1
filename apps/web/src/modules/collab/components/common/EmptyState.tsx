import React, { ReactNode } from 'react';
import { CircleSlash } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * Reusable empty state component for when there's no data to display
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <CircleSlash className="h-12 w-12 text-muted-foreground" />,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center bg-muted/20 rounded-lg">
      <div className="flex flex-col items-center space-y-2">
        {icon}
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;