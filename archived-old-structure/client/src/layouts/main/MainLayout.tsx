import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { VerticalNav } from '@/shared/navigation/vertical-nav/VerticalNav';
import { EnhancedBreadcrumbs, BreadcrumbItem } from '@/shared/navigation/breadcrumbs/EnhancedBreadcrumbs';
import { createLogger } from '@/utils/logger/logger';
import { createAuditLogger } from '@/utils/audit/audit-logger';
import { 
  Home, 
  LayoutDashboard, 
  FileText, 
  DollarSign, 
  BarChart3, 
  Users, 
  ShoppingCart, 
  Warehouse, 
  Settings, 
  UserCircle, 
  Bell, 
  Search, 
  Menu as MenuIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Initialize loggers
const logger = createLogger('main-layout');
const auditLog = createAuditLogger('layout');

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * Main application layout with responsive sidebar, breadcrumbs and header
 */
export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  description
}) => {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    logger.debug(`Mobile menu ${isMobileMenuOpen ? 'closed' : 'opened'}`);
    setIsMobileMenuOpen(!isMobileMenuOpen);
    
    auditLog.log({
      action: 'update',
      entityType: 'ui',
      entityId: 'mobile-menu',
      details: { open: !isMobileMenuOpen },
      metadata: { method: 'toggle' }
    });
  };
  
  // Generate breadcrumbs based on current location
  useEffect(() => {
    const generateBreadcrumbs = () => {
      // Root path
      if (location === '/') {
        return [];
      }
      
      // Split the path into segments and create breadcrumb items
      const pathSegments = location.split('/').filter(Boolean);
      const items: BreadcrumbItem[] = [];
      
      let currentPath = '';
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += '/' + segment;
        
        // Format the segment for display (capitalize, replace hyphens)
        const formattedLabel = segment
          .replace(/-/g, ' ')
          .replace(/\\b\\w/g, char => char.toUpperCase());
        
        items.push({
          label: formattedLabel,
          href: currentPath,
          active: i === pathSegments.length - 1
        });
      }
      
      return items;
    };
    
    const newBreadcrumbs = generateBreadcrumbs();
    setBreadcrumbs(newBreadcrumbs);
    
    logger.debug('Updated breadcrumbs based on location change', {
      context: { location, breadcrumbCount: newBreadcrumbs.length }
    });
  }, [location]);
  
  // Mock navigation items - to be replaced with dynamic items based on permissions
  const navigationItems = [
    { 
      type: 'item' as const, 
      href: '/', 
      label: 'Home', 
      icon: <Home size={18} />,
      moduleId: 'home'
    },
    { 
      type: 'item' as const, 
      href: '/dashboard', 
      label: 'Dashboard', 
      icon: <LayoutDashboard size={18} />,
      moduleId: 'dashboard'
    },
    {
      type: 'group' as const,
      label: 'Accounting',
      icon: <DollarSign size={18} />,
      moduleId: 'accounting',
      items: [
        { href: '/accounting/journal', label: 'Journal', icon: <FileText size={16} /> },
        { href: '/accounting/ledger', label: 'Ledger', icon: <FileText size={16} /> },
        { href: '/accounting/reports', label: 'Reports', icon: <BarChart3 size={16} /> }
      ]
    },
    {
      type: 'group' as const,
      label: 'Inventory',
      icon: <Warehouse size={18} />,
      moduleId: 'inventory',
      items: [
        { href: '/inventory/stock', label: 'Stock', icon: <FileText size={16} /> },
        { href: '/inventory/warehouse', label: 'Warehouse', icon: <Warehouse size={16} /> },
        { href: '/inventory/transfers', label: 'Transfers', icon: <FileText size={16} /> }
      ]
    },
    {
      type: 'group' as const,
      label: 'HR',
      icon: <Users size={18} />,
      moduleId: 'hr',
      items: [
        { href: '/hr/employees', label: 'Employees', icon: <Users size={16} /> },
        { href: '/hr/departments', label: 'Departments', icon: <Users size={16} /> },
        { href: '/hr/payroll', label: 'Payroll', icon: <DollarSign size={16} /> }
      ]
    },
    {
      type: 'group' as const,
      label: 'E-commerce',
      icon: <ShoppingCart size={18} />,
      moduleId: 'ecommerce',
      items: [
        { href: '/ecommerce/products', label: 'Products', icon: <ShoppingCart size={16} /> },
        { href: '/ecommerce/orders', label: 'Orders', icon: <FileText size={16} /> },
        { href: '/ecommerce/customers', label: 'Customers', icon: <Users size={16} /> }
      ]
    },
    { 
      type: 'item' as const, 
      href: '/settings', 
      label: 'Settings', 
      icon: <Settings size={18} />,
      moduleId: 'settings'
    },
  ];
  
  // Log layout rendering
  useEffect(() => {
    logger.startTimer('main-layout-render');
    logger.info('MainLayout mounted', { 
      context: { title, location } 
    });
    
    return () => {
      logger.endTimer('main-layout-render');
    };
  }, [title, location]);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <VerticalNav items={navigationItems} defaultCollapsed={false} />
      </div>
      
      {/* Mobile Sidebar - Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}
      
      {/* Mobile Sidebar - Content */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <VerticalNav items={navigationItems} defaultCollapsed={false} />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-4 bg-background">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={toggleMobileMenu}
            >
              <MenuIcon className="h-5 w-5 text-primary dark:text-greenSecondary" />
            </Button>
            
            {/* Title */}
            <div>
              <h1 className="text-xl font-semibold text-primary dark:text-greenTertiary">
                {title || 'Dashboard'}
              </h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:block relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="Search..." 
                className="pl-8 w-[200px] lg:w-[300px] h-9"
              />
            </div>
            
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-redPrimary" />
            </Button>
            
            {/* User Profile */}
            <Button variant="ghost" size="icon">
              <UserCircle className="h-6 w-6 text-primary dark:text-greenSecondary" />
            </Button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="py-2 px-4 border-b">
              <EnhancedBreadcrumbs items={breadcrumbs} />
            </div>
          )}
          
          {/* Content */}
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};