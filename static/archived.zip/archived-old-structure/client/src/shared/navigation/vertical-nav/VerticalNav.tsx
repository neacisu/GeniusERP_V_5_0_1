import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { createLogger } from '@/utils/logger/logger';
import { createAuditLogger } from '@/utils/audit/audit-logger';

// Create loggers for this component
const logger = createLogger('vertical-nav');
const auditLog = createAuditLogger('navigation');

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: {
    content: string;
    variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  };
  onClick?: () => void;
  moduleId?: string; // For audit logging
}

interface SubNavItemProps extends NavItemProps {
  depth?: number;
}

interface NavGroupProps {
  label: string;
  icon: React.ReactNode;
  items: Omit<NavItemProps, 'isActive' | 'isCollapsed'>[];
  isCollapsed: boolean;
  defaultOpen?: boolean;
  activePath: string;
  moduleId?: string; // For audit logging
}

const badgeVariantStyles = {
  default: 'bg-primary text-primary-foreground dark:bg-primaryDark dark:text-white',
  success: 'bg-success text-white',
  warning: 'bg-orangeSecondary text-white',
  danger: 'bg-redSecondary text-white',
  info: 'bg-greenTertiary text-white',
};

const Badge = ({ content, variant = 'default' }: { content: string; variant: string }) => (
  <span className={cn(
    'ml-auto rounded-full px-2 py-0.5 text-xs font-medium',
    badgeVariantStyles[variant as keyof typeof badgeVariantStyles] || badgeVariantStyles.default
  )}>
    {content}
  </span>
);

const NavItem = ({ href, label, icon, isActive, isCollapsed, badge, onClick, moduleId }: NavItemProps) => {
  const handleClick = () => {
    logger.debug(`Navigation to: ${label} (${href})`, { context: { moduleId } });
    
    // Audit log the navigation event
    if (moduleId) {
      auditLog.log({
        action: 'read',
        entityType: 'navigation',
        entityId: moduleId,
        details: { label, href },
        metadata: { method: 'navigation' }
      });
    }
    
    if (onClick) onClick();
  };

  return (
    <Link href={href}>
      <a 
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive 
            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' 
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          isCollapsed && 'justify-center px-2'
        )}
        onClick={handleClick}
      >
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="flex h-9 w-9 items-center justify-center rounded-md">
                  {icon}
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                {label}
                {badge && <Badge content={badge.content} variant={badge.variant} />}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            <span className="flex h-5 w-5 items-center justify-center text-primary dark:text-greenSecondary">
              {icon}
            </span>
            <span className="flex-1">{label}</span>
            {badge && <Badge content={badge.content} variant={badge.variant} />}
          </>
        )}
      </a>
    </Link>
  );
};

const SubNavItem = ({ href, label, icon, isActive, isCollapsed, badge, depth = 1, moduleId }: SubNavItemProps) => {
  const handleClick = () => {
    logger.debug(`Navigation to sub-item: ${label} (${href})`, { context: { moduleId, depth } });
    
    // Audit log the navigation event
    if (moduleId) {
      auditLog.log({
        action: 'read',
        entityType: 'navigation',
        entityId: moduleId,
        details: { label, href, depth },
        metadata: { method: 'sub-navigation' }
      });
    }
  };

  return (
    <Link href={href}>
      <a
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive 
            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' 
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          !isCollapsed && `pl-${(depth + 1) * 3}`,
          isCollapsed && 'justify-center px-2'
        )}
        onClick={handleClick}
      >
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="flex h-9 w-9 items-center justify-center rounded-md">
                  {icon}
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                {label}
                {badge && <Badge content={badge.content} variant={badge.variant} />}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            <span className="flex h-5 w-5 items-center justify-center text-greenSecondary">
              {icon}
            </span>
            <span className="flex-1">{label}</span>
            {badge && <Badge content={badge.content} variant={badge.variant} />}
          </>
        )}
      </a>
    </Link>
  );
};

const NavGroup = ({ label, icon, items, isCollapsed, defaultOpen = false, activePath, moduleId }: NavGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Log when a group is expanded/collapsed
  const handleToggle = (newState: boolean) => {
    logger.debug(`Navigation group ${newState ? 'expanded' : 'collapsed'}: ${label}`, { 
      context: { moduleId, items: items.length } 
    });
    setIsOpen(newState);
  };
  
  // Auto-expand the group when one of its items is active
  useEffect(() => {
    if (!isOpen && items.some(item => activePath.startsWith(item.href))) {
      setIsOpen(true);
      logger.debug(`Auto-expanded navigation group: ${label} due to active path`, {
        context: { activePath, moduleId }
      });
    }
  }, [activePath, isOpen, items, label, moduleId]);

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md p-0">
              {icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="flex flex-col gap-2 p-2 w-48">
            <div className="font-medium">{label}</div>
            <div className="space-y-1">
              {items.map((item, index) => (
                <Link key={index} href={item.href}>
                  <a 
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
                    onClick={() => {
                      logger.debug(`Navigation to group item: ${item.label} (${item.href})`, {
                        context: { groupLabel: label, moduleId: item.moduleId || moduleId }
                      });
                      
                      // Audit log the navigation event
                      if (item.moduleId || moduleId) {
                        auditLog.log({
                          action: 'read',
                          entityType: 'navigation',
                          entityId: (item.moduleId || moduleId || 'unknown'),
                          details: { groupLabel: label, itemLabel: item.label, href: item.href },
                          metadata: { method: 'tooltip-navigation' }
                        });
                      }
                    }}
                  >
                    <span className="flex h-4 w-4 items-center justify-center text-primary dark:text-greenSecondary">
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge content={item.badge.content} variant={item.badge.variant} />
                    )}
                  </a>
                </Link>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleToggle}
      className="w-full"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'flex w-full items-center justify-between p-2',
            isOpen && 'bg-muted dark:bg-muted/80'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center text-orangePrimary">
              {icon}
            </span>
            <span className="flex-1">{label}</span>
          </div>
          <div>
            {isOpen ? 
              <ChevronDown className="h-4 w-4 text-orangeSecondary" /> : 
              <ChevronRight className="h-4 w-4 text-orangeSecondary" />
            }
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pt-1">
        {items.map((item, index) => (
          <SubNavItem
            key={index}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={activePath === item.href}
            isCollapsed={false}
            badge={item.badge}
            moduleId={item.moduleId || moduleId}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface VerticalNavProps {
  items: (
    | ({ type: 'item' } & Omit<NavItemProps, 'isActive' | 'isCollapsed'>)
    | ({ type: 'group' } & Omit<NavGroupProps, 'isCollapsed' | 'activePath'>)
  )[];
  defaultCollapsed?: boolean;
  appName?: string;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export const VerticalNav = ({
  items,
  defaultCollapsed = false,
  appName = 'Enterprise ERP',
  onToggleCollapse
}: VerticalNavProps) => {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Log when the sidebar is collapsed/expanded
  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    logger.info(`Sidebar ${newCollapsedState ? 'collapsed' : 'expanded'}`);
    
    // Audit log the sidebar state change
    auditLog.log({
      action: 'update',
      entityType: 'ui',
      entityId: 'sidebar',
      details: { collapsed: newCollapsedState },
      metadata: { method: 'toggle' }
    });
    
    setIsCollapsed(newCollapsedState);
    if (onToggleCollapse) onToggleCollapse(newCollapsedState);
  };
  
  // Log when the component mounts with performance tracking
  useEffect(() => {
    logger.startTimer('vertical-nav-render');
    logger.info('VerticalNav mounted', { 
      context: { 
        items: items.length, 
        defaultCollapsed, 
        currentLocation: location 
      } 
    });
    
    return () => {
      logger.endTimer('vertical-nav-render');
    };
  }, [items.length, defaultCollapsed, location]);
  
  return (
    <div
      className={cn(
        'flex flex-col border-r bg-background transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[60px]' : 'w-[260px]'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <span className="font-semibold truncate text-primary dark:text-greenTertiary">{appName}</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className="h-8 w-8 text-primary dark:text-greenSecondary"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className={cn('p-2', !isCollapsed && 'space-y-1')}>
          {items.map((item, i) => {
            if (item.type === 'item') {
              return (
                <NavItem
                  key={i}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={location === item.href}
                  isCollapsed={isCollapsed}
                  badge={item.badge}
                  moduleId={item.moduleId}
                />
              );
            }
            
            if (item.type === 'group') {
              return (
                <NavGroup
                  key={i}
                  label={item.label}
                  icon={item.icon}
                  items={item.items}
                  isCollapsed={isCollapsed}
                  defaultOpen={item.defaultOpen}
                  activePath={location}
                  moduleId={item.moduleId}
                />
              );
            }
            
            return null;
          })}
        </div>
      </ScrollArea>
    </div>
  );
};