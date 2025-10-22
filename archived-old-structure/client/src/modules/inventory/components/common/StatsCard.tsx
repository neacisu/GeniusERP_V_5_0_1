/**
 * Stats Card Component
 * 
 * A reusable card for displaying statistics or metrics in the inventory module.
 */

import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  valuePrefix?: string;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  valuePrefix,
  description,
  icon,
  trend,
  className,
  onClick,
}) => {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:border-primary/50",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h4 className="mt-2 text-2xl font-bold">{valuePrefix ? `${valuePrefix}${value}` : value}</h4>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className="mt-2 flex items-center text-xs">
                <span
                  className={cn(
                    "mr-1 flex items-center font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.isPositive ? "↑" : "↓"} {trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          {icon && <div className="h-9 w-9 rounded-full bg-primary/10 p-2 text-primary">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;