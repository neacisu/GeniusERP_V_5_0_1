/**
 * Analytics Empty State
 * 
 * Componentă pentru afișarea stării empty pentru diverse pagini din modulul Analytics
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface AnalyticsEmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel?: string;
  actionLink?: string;
  actionIcon?: React.ReactNode;
  variant?: 'default' | 'card';
  action?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  };
}

export const AnalyticsEmptyState = ({
  title,
  description,
  icon,
  actionLabel,
  actionLink,
  actionIcon,
  variant = 'default',
  action
}: AnalyticsEmptyStateProps) => {
  // Backward compatibility support
  const finalActionLabel = action?.label || actionLabel;
  const finalActionLink = action?.href || actionLink;
  const finalActionIcon = action?.icon || actionIcon;
  
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${variant === 'card' ? 'border rounded-lg bg-muted/10' : ''}`}>
      <div className="text-muted-foreground opacity-20 mb-4 h-16 w-16">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-center">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
        {description}
      </p>
      {finalActionLabel && finalActionLink && (
        <Button variant="outline" className="mt-6" asChild>
          <Link href={finalActionLink}>
            {finalActionIcon && <span className="mr-2">{finalActionIcon}</span>}
            <span>{finalActionLabel}</span>
          </Link>
        </Button>
      )}
    </div>
  );
};

// Backward compatibility pentru importuri default
export default AnalyticsEmptyState;