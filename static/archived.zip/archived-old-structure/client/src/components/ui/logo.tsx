import React from 'react';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  className?: string;
  showVersion?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Logo Component
 * 
 * Reusable logo component for consistent branding across the application
 */
export function Logo({ 
  className = '', 
  showVersion = true,
  size = 'md'
}: LogoProps) {
  const sizes = {
    sm: {
      container: 'w-8 h-8',
      icon: 'h-4 w-4',
      text: 'text-lg',
      version: 'text-xs'
    },
    md: {
      container: 'w-10 h-10',
      icon: 'h-6 w-6',
      text: 'text-2xl',
      version: 'text-xs'
    },
    lg: {
      container: 'w-12 h-12',
      icon: 'h-7 w-7',
      text: 'text-3xl',
      version: 'text-sm'
    },
  };

  const sizeClasses = sizes[size];

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeClasses.container} rounded bg-primary flex items-center justify-center`}>
        <Sparkles className={`${sizeClasses.icon} text-white`} />
      </div>
      <span className={`ml-3 ${sizeClasses.text} font-semibold text-gray-900`}>GeniusERP</span>
      {showVersion && (
        <span className={`ml-1 ${sizeClasses.version} text-primary font-medium`}>v.5</span>
      )}
    </div>
  );
}

export default Logo;