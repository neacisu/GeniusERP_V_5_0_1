/**
 * BPM Overview Card Component
 * 
 * Componenta pentru afișarea statisticilor în format de card pentru modulul BPM
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export interface BPMOverviewCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function BPMOverviewCard({
  title,
  value,
  icon,
  variant = 'default',
  action
}: BPMOverviewCardProps) {
  // Compute background and text colors based on variant
  const getCardStyles = () => {
    switch (variant) {
      case 'success':
        return {
          background: 'bg-green-50 dark:bg-green-950/20',
          iconBackground: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-900',
          textColor: 'text-green-700 dark:text-green-400',
        };
      case 'warning':
        return {
          background: 'bg-amber-50 dark:bg-amber-950/20',
          iconBackground: 'bg-amber-100 dark:bg-amber-900/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          borderColor: 'border-amber-200 dark:border-amber-900',
          textColor: 'text-amber-700 dark:text-amber-400',
        };
      case 'info':
        return {
          background: 'bg-blue-50 dark:bg-blue-950/20',
          iconBackground: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-200 dark:border-blue-900',
          textColor: 'text-blue-700 dark:text-blue-400',
        };
      case 'danger':
        return {
          background: 'bg-red-50 dark:bg-red-950/20',
          iconBackground: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-900',
          textColor: 'text-red-700 dark:text-red-400',
        };
      default:
        return {
          background: 'bg-card',
          iconBackground: 'bg-primary/10',
          iconColor: 'text-primary',
          borderColor: 'border-gray-200',
          textColor: 'text-foreground',
        };
    }
  };

  const styles = getCardStyles();
  
  return (
    <Card className={`${styles.background} border ${styles.borderColor}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${styles.textColor}`}>{value}</p>
          </div>
          <div className={`p-2 rounded-full ${styles.iconBackground}`}>
            <div className={styles.iconColor}>
              {icon}
            </div>
          </div>
        </div>
        
        {action && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              className={`px-0 hover:bg-transparent ${styles.textColor} hover:${styles.textColor} hover:underline`}
              onClick={action.onClick}
            >
              {action.label}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}