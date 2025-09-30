import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  subtitle?: string;
}

/**
 * Stats Card Component
 * 
 * Displays a single statistic with an icon
 */
const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  color,
  subtitle 
}) => {
  // Define color classes
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-green-50 text-green-600',
    danger: 'bg-red-50 text-red-600',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-blue-50 text-blue-600'
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;