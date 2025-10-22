/**
 * Analytics Overview Card
 * 
 * Componentă card reutilizabilă pentru afișarea metricilor cheie
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Info, Minus } from 'lucide-react';

interface AnalyticsOverviewCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  data?: Array<{ value: number }>;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  tooltipText?: string;
}

export function AnalyticsOverviewCard({
  title,
  value,
  description,
  icon,
  change,
  trend,
  data,
  variant = 'default',
  tooltipText
}: AnalyticsOverviewCardProps) {
  
  // Determină clasele de culoare bazate pe varianta specificată
  const getColorClasses = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-amber-600';
      case 'danger':
        return 'text-red-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-primary';
    }
  };
  
  // Determină culoarea bazată pe trend
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };
  
  // Determină iconița bazată pe trend
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 mr-1" />;
    if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 mr-1" />;
    return <Minus className="h-3.5 w-3.5 mr-1" />;
  };
  
  // Formatează procentajul de schimbare
  const formatChange = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  
  // Calculează valori pentru mini sparkline
  const getSparklinePoints = () => {
    if (!data || data.length === 0) return '';
    
    const values = data.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values) - min || 1;
    const width = 100 / (values.length - 1);
    
    return values.map((value, index) => {
      const x = index * width;
      const y = 100 - ((value - min) / max) * 100;
      return `${x},${y}`;
    }).join(' ');
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">
          {title}
          {tooltipText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground inline-block cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <span className={`p-1.5 rounded-full ${getColorClasses()} bg-opacity-15`}>
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center">
        <div className={`text-xs font-medium flex items-center ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{formatChange(change)}</span>
        </div>
        
        {data && data.length > 1 && (
          <div className="h-8 w-16">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={getSparklinePoints()}
                fill="none"
                stroke={
                  variant === 'success' ? '#16a34a' :
                  variant === 'warning' ? '#d97706' :
                  variant === 'danger' ? '#dc2626' :
                  variant === 'info' ? '#2563eb' :
                  'currentColor'
                }
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                className={variant === 'default' ? 'text-primary' : ''}
              />
            </svg>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}