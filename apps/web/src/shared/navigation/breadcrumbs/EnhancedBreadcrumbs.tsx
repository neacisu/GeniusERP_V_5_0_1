import React from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';
import { createLogger } from '@/utils/logger/logger';
import { createAuditLogger } from '@/utils/audit/audit-logger';

// Create loggers for this component
const logger = createLogger('breadcrumbs');
const auditLog = createAuditLogger('navigation');

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

export interface EnhancedBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  homeHref?: string;
  homeIcon?: React.ReactNode;
  separator?: React.ReactNode;
  showHome?: boolean;
  maxItems?: number;
  truncateFrom?: 'start' | 'end' | 'middle';
  moduleId?: string; // For audit logging
}

/**
 * Enhanced breadcrumbs component with improved features:
 * - Custom separators
 * - Home icon/link
 * - Truncation options
 * - Icons support
 * - Audit logging
 */
export const EnhancedBreadcrumbs = ({
  items,
  className,
  homeHref = '/',
  homeIcon = <Home size={16} />,
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground" />,
  showHome = true,
  maxItems = 0, // 0 means show all
  truncateFrom = 'middle',
  moduleId
}: EnhancedBreadcrumbsProps) => {
  // Handle logging navigation via breadcrumbs
  const handleBreadcrumbClick = (item: BreadcrumbItem, index: number) => {
    logger.debug(`Navigation via breadcrumb: ${item.label} (${item.href})`, {
      context: { position: index, moduleId }
    });
    
    // Audit log the navigation event
    auditLog.log({
      action: 'read',
      entityType: 'navigation',
      entityId: moduleId || 'breadcrumbs',
      details: { label: item.label, href: item.href, position: index },
      metadata: { method: 'breadcrumb-navigation' }
    });
  };

  // Handle clicking the home breadcrumb
  const handleHomeClick = () => {
    logger.debug('Navigation via home breadcrumb', { 
      context: { href: homeHref, moduleId } 
    });
    
    // Audit log the home navigation event
    auditLog.log({
      action: 'read',
      entityType: 'navigation',
      entityId: moduleId || 'breadcrumbs',
      details: { label: 'Home', href: homeHref },
      metadata: { method: 'home-breadcrumb-navigation' }
    });
  };

  // Process items for display, applying truncation if needed
  const processedItems = React.useMemo(() => {
    if (maxItems <= 0 || items.length <= maxItems) {
      return items;
    }

    // Apply truncation based on the selected strategy
    if (truncateFrom === 'start') {
      const ellipsisItem: BreadcrumbItem = {
        label: '...',
        href: '',
        active: false
      };
      return [ellipsisItem, ...items.slice(items.length - maxItems + 1)];
    } else if (truncateFrom === 'end') {
      const ellipsisItem: BreadcrumbItem = {
        label: '...',
        href: '',
        active: false
      };
      return [...items.slice(0, maxItems - 1), ellipsisItem];
    } else {
      // Middle truncation
      const ellipsisItem: BreadcrumbItem = {
        label: '...',
        href: '',
        active: false
      };
      
      const leftCount = Math.floor((maxItems - 1) / 2);
      const rightCount = maxItems - leftCount - 1;
      
      return [
        ...items.slice(0, leftCount),
        ellipsisItem,
        ...items.slice(items.length - rightCount)
      ];
    }
  }, [items, maxItems, truncateFrom]);

  return (
    <nav 
      className={cn(
        "flex items-center text-sm text-muted-foreground",
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {showHome && (
          <li className="flex items-center">
            <Link href={homeHref}>
              <a 
                className="flex items-center text-foreground/60 hover:text-primary dark:hover:text-greenTertiary transition-colors"
                onClick={handleHomeClick}
              >
                {homeIcon}
              </a>
            </Link>
          </li>
        )}
        
        {showHome && processedItems.length > 0 && (
          <li className="flex items-center">{separator}</li>
        )}
        
        {processedItems.map((item, index) => (
          <React.Fragment key={index}>
            <li className="flex items-center">
              {item.href && !item.active ? (
                <Link href={item.href}>
                  <a 
                    className={cn(
                      "flex items-center gap-1 hover:text-primary dark:hover:text-greenTertiary transition-colors",
                      item.active && "text-foreground font-medium pointer-events-none"
                    )}
                    aria-current={item.active ? 'page' : undefined}
                    onClick={() => handleBreadcrumbClick(item, index)}
                  >
                    {item.icon && (
                      <span className="h-4 w-4 text-muted-foreground">{item.icon}</span>
                    )}
                    <span>{item.label}</span>
                  </a>
                </Link>
              ) : (
                <span 
                  className={cn(
                    "flex items-center gap-1",
                    item.active 
                      ? "text-foreground font-medium"
                      : "text-muted-foreground" // For ellipsis item
                  )}
                  aria-current={item.active ? 'page' : undefined}
                >
                  {item.icon && (
                    <span className="h-4 w-4">{item.icon}</span>
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
            
            {index < processedItems.length - 1 && (
              <li className="flex items-center">{separator}</li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};