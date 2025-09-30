/**
 * Marketing Stats Card Component
 * 
 * Displays a statistic with icon, title, value and optional change indicator.
 * Used in marketing dashboard and analytics pages.
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  loading?: boolean;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon,
  change,
  changeLabel,
  loading = false,
  className = ""
}) => {
  // Determine change indicator styling
  const isPositiveChange = change && change > 0;
  const isNegativeChange = change && change < 0;
  const changeValue = change ? Math.abs(change) : null;
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1 mt-1">
              {loading ? (
                <div className="h-9 w-20 bg-muted animate-pulse rounded-md"></div>
              ) : (
                <h3 className="text-2xl font-bold tracking-tight">
                  {value}
                </h3>
              )}
            </div>
            
            {(change !== undefined && !loading) && (
              <div className="flex items-center mt-2">
                <span 
                  className={cn(
                    "text-xs font-medium",
                    isPositiveChange && "text-green-600",
                    isNegativeChange && "text-red-600"
                  )}
                >
                  {isPositiveChange && "+"}
                  {changeValue}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className={cn(
            "p-2 rounded-full",
            "bg-primary/10 text-primary"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;