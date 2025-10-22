/**
 * Empty State Component
 * 
 * Reusable component for displaying empty state messages with optional action button.
 */

import React, { ReactNode } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: ReactNode;
  filterActive?: boolean;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  actionIcon,
  filterActive = false,
  onAction
}) => {
  const renderActionButton = () => {
    if (!actionLabel) return null;
    
    if (onAction) {
      return (
        <Button size="sm" onClick={onAction}>
          {actionIcon}
          {actionLabel}
        </Button>
      );
    }
    
    if (actionHref) {
      return (
        <Button asChild size="sm">
          <Link href={actionHref}>
            {actionIcon}
            {actionLabel}
          </Link>
        </Button>
      );
    }
    
    return null;
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="text-muted-foreground mb-2">
        {icon}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {description}
      </p>
      {!filterActive && renderActionButton()}
    </div>
  );
};

export default EmptyState;