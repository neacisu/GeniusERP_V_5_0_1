/**
 * InfoCard Component
 * 
 * Displays a list of information items with optional actions
 */

import React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ExternalLink, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import SettingCard from "./SettingCard";

interface InfoItem {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  actionExternal?: boolean;
}

interface InfoCardProps {
  title: string;
  description?: string;
  items: InfoItem[];
  icon?: React.ReactNode;
  variant?: "default" | "info" | "warning" | "error" | "success";
  className?: string;
}

export default function InfoCard({
  title,
  description,
  items,
  icon,
  variant = "default",
  className
}: InfoCardProps) {
  const variantStyles = {
    default: "bg-card",
    info: "bg-blue-50 border-blue-200",
    warning: "bg-orange-50 border-orange-200",
    error: "bg-red-50 border-red-200",
    success: "bg-green-50 border-green-200"
  };

  return (
    <SettingCard
      title={title}
      description={description}
      className={cn(variantStyles[variant], className)}
      headerAction={icon || <InfoIcon className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <h3 className="font-medium text-sm">{item.title}</h3>
              {item.actionHref && (
                item.actionExternal ? (
                  <a 
                    href={item.actionHref} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-primary hover:underline"
                  >
                    {item.actionLabel || "Detalii"}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  <Link href={item.actionHref}>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      {item.actionLabel || "Configurează"}
                    </Button>
                  </Link>
                )
              )}
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </SettingCard>
  );
}