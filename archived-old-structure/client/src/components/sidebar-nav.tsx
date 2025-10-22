/**
 * Sidebar Navigation Component
 * 
 * Reusable component for sidebar navigation across modules
 */

import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface SidebarNavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  external?: boolean;
  exact?: boolean;
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarNavItem[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const [location] = useLocation();

  return (
    <nav
      className={cn(
        "flex space-y-1 flex-col",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const isActive = item.exact
          ? location === item.href
          : location.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.disabled ? "#" : item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive
                ? "bg-muted hover:bg-muted font-medium text-primary"
                : "hover:bg-transparent hover:text-foreground text-muted-foreground",
              "justify-start",
              item.disabled && "cursor-not-allowed opacity-60",
              "h-10"
            )}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noreferrer" : undefined}
          >
            {item.icon}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}