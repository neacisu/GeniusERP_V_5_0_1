/**
 * Marketing Page Header Component
 * 
 * Standard page header for marketing module pages with title,
 * optional description and action buttons.
 */

import React, { ReactNode } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbItemData {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  backButton?: boolean;
  backHref?: string;
  breadcrumbs?: BreadcrumbItemData[];
  actions?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  backButton = false,
  backHref,
  breadcrumbs,
  actions,
}) => {
  const [_, navigate] = useLocation();

  const handleBack = () => {
    if (backHref) {
      navigate(backHref);
    } else {
      window.history.back();
    }
  };

  return (
    <div className="flex flex-col space-y-2 pb-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbLink>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {backButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Înapoi</span>
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;