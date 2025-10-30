/**
 * BPM Empty State Component
 * 
 * Componenta pentru afișarea stării goale sau fără rezultate în modulul BPM
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface BPMEmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'card' | 'inline';
  className?: string;
}

const BPMEmptyState: React.FC<BPMEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  variant = 'inline',
  className
}) => {
  const EmptyStateContent = () => (
    <div className={`flex flex-col items-center justify-center text-center space-y-4 ${className || ''}`}>
      <div className="bg-muted/30 rounded-full p-6 text-muted-foreground">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          {description}
        </p>
      </div>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className={`border-dashed ${className || ''}`}>
        <CardContent className="py-8">
          <EmptyStateContent />
        </CardContent>
      </Card>
    );
  }

  return <EmptyStateContent />;
};

export default BPMEmptyState;