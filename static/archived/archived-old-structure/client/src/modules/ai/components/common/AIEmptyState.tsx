/**
 * AI Empty State
 * 
 * Componentă reutilizabilă pentru afișarea stărilor goale (empty states)
 * în modulul AI. Permite personalizarea și acțiuni primare și secundare.
 */

import React, { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InboxIcon } from "lucide-react";

interface ActionProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface AIEmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  primaryAction?: ActionProps;
  secondaryAction?: ActionProps;
  variant?: "centered" | "aligned";
}

export function AIEmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  variant = "aligned"
}: AIEmptyStateProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card shadow-sm",
      variant === "centered" ? "text-center" : "text-left"
    )}>
      <div className={cn(
        "flex flex-col space-y-4 p-12",
        variant === "centered" ? "items-center" : "items-start"
      )}>
        <div className={cn(
          "rounded-full p-3 bg-primary/10",
          variant === "centered" ? "mx-auto" : ""
        )}>
          {icon || <InboxIcon className="h-8 w-8 text-primary/80" />}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>
        </div>
        
        {(primaryAction || secondaryAction) && (
          <div className={cn(
            "pt-2 flex gap-2",
            variant === "centered" 
              ? "flex-col sm:flex-row justify-center items-center" 
              : "flex-col sm:flex-row items-start"
          )}>
            {primaryAction && (
              primaryAction.href ? (
                <Button asChild>
                  <Link href={primaryAction.href}>
                    {primaryAction.label}
                  </Link>
                </Button>
              ) : (
                <Button onClick={primaryAction.onClick}>
                  {primaryAction.label}
                </Button>
              )
            )}
            
            {secondaryAction && (
              secondaryAction.href ? (
                <Button variant="outline" asChild>
                  <Link href={secondaryAction.href}>
                    {secondaryAction.label}
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}