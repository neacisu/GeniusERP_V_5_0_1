/**
 * SettingCategoryCard Component
 * 
 * A card used to display and navigate to setting categories
 */

import React from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SettingCard from "./SettingCard";

interface SettingCategoryCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  className?: string;
}

export default function SettingCategoryCard({
  title,
  description,
  icon: Icon,
  href,
  className
}: SettingCategoryCardProps) {
  return (
    <SettingCard 
      title={title}
      description={description}
      className={`hover:border-primary/50 transition-colors ${className}`}
      headerAction={
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      }
      footerContent={
        <Link href={href}>
          <Button variant="outline" className="w-full justify-between">
            Configurează
            <ChevronRight className="h-4 w-4 opacity-70" />
          </Button>
        </Link>
      }
    />
  );
}