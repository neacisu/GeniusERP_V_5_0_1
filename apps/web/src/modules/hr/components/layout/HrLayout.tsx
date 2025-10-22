/**
 * Layout principal pentru modulul HR
 * 
 * Acest component asigură un aspect consistent pentru toate paginile din modulul HR,
 * incluzând navigarea între secțiuni și stilizarea comună.
 */

import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  Users,
  ClipboardList,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  Banknote,
  BarChartHorizontal,
  Settings,
  PlusCircle,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface HrLayoutProps {
  children: ReactNode;
  activeTab?: string;
  title?: string;
  subtitle?: string;
  action?: {
    label: string;
    href: string;
    icon?: ReactNode;
  };
  backLink?: {
    label: string;
    href: string;
  };
}

const tabs = [
  {
    id: 'employees',
    label: 'Angajați',
    href: '/hr/employees',
    icon: <Users className="w-5 h-5 mr-2" />,
  },
  {
    id: 'contracts',
    label: 'Contracte',
    href: '/hr/contracts',
    icon: <ClipboardList className="w-5 h-5 mr-2" />,
  },
  {
    id: 'departments',
    label: 'Departamente',
    href: '/hr/departments',
    icon: <Building2 className="w-5 h-5 mr-2" />,
  },
  {
    id: 'positions',
    label: 'Poziții',
    href: '/hr/positions',
    icon: <BriefcaseBusiness className="w-5 h-5 mr-2" />,
  },
  {
    id: 'absences',
    label: 'Absențe',
    href: '/hr/absences',
    icon: <CalendarDays className="w-5 h-5 mr-2" />,
  },
  {
    id: 'payroll',
    label: 'Salarizare',
    href: '/hr/payroll',
    icon: <Banknote className="w-5 h-5 mr-2" />,
  },
  {
    id: 'commissions',
    label: 'Comisioane',
    href: '/hr/commissions',
    icon: <BarChartHorizontal className="w-5 h-5 mr-2" />,
  },
  {
    id: 'settings',
    label: 'Setări HR',
    href: '/hr/settings',
    icon: <Settings className="w-5 h-5 mr-2" />,
  },
];

const HrLayout: React.FC<HrLayoutProps> = ({
  children,
  activeTab,
  title,
  subtitle,
  action,
  backLink,
}) => {
  return (
    <div className="container py-6 space-y-6 max-w-7xl">
      {/* Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              asChild
            >
              <Link href={tab.href}>
                <div className="flex items-center">
                  {tab.icon}
                  {tab.label}
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {backLink && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href={backLink.href}>
                <div className="flex items-center">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {backLink.label}
                </div>
              </Link>
            </Button>
          )}
          {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {action && (
          <Button asChild>
            <Link href={action.href}>
              <div className="flex items-center">
                {action.icon || <PlusCircle className="mr-2 h-4 w-4" />}
                {action.label}
              </div>
            </Link>
          </Button>
        )}
      </div>

      <Separator />

      {/* Content */}
      <div>{children}</div>
    </div>
  );
};

export default HrLayout;