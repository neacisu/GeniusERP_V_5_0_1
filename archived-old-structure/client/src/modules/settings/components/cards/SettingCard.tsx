/**
 * SettingCard Component
 * 
 * Base card component for settings with customizable header and footer
 */

import React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface SettingCardProps {
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  footerContent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export default function SettingCard({
  title,
  description,
  headerAction,
  footerContent,
  children,
  className,
  contentClassName,
  footerClassName
}: SettingCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {description}
            </CardDescription>
          )}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </CardHeader>
      
      {children && (
        <CardContent className={cn("px-6 py-4", contentClassName)}>
          {children}
        </CardContent>
      )}
      
      {footerContent && (
        <CardFooter className={cn("px-6 py-4 bg-secondary/10", footerClassName)}>
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
}