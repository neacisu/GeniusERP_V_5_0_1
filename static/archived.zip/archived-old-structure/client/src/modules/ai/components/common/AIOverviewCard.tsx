/**
 * AI Overview Card
 * 
 * Componentă reutilizabilă ce afișează un card cu funcționalități AI.
 * Este folosită în dashboard-ul AI și în alte pagini de prezentare.
 */

import React, { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface AIOverviewCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  features?: string[];
  status?: "active" | "coming_soon" | "beta";
  actionLink?: string;
  variant?: "default" | "highlight";
}

export function AIOverviewCard({
  title,
  description,
  icon,
  features = [],
  status = "active",
  actionLink,
  variant = "default"
}: AIOverviewCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden h-full flex flex-col",
      variant === "highlight" ? "border-primary/50 shadow-md" : ""
    )}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          {icon && (
            <div className="rounded-md p-2 bg-slate-50 mr-2">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </div>
          {status && (
            <Badge 
              variant="outline" 
              className={cn(
                "ml-2 font-normal",
                status === "active" ? "bg-green-50 text-green-700 hover:bg-green-100" : 
                status === "coming_soon" ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : 
                "bg-amber-50 text-amber-700 hover:bg-amber-100"
              )}
            >
              {status === "active" ? "Activ" : 
               status === "coming_soon" ? "În curând" : "Beta"}
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        {features.length > 0 && (
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {actionLink && (
        <CardFooter className="pt-2 pb-4 px-6">
          <Button 
            variant={variant === "highlight" ? "default" : "outline"} 
            size="sm" 
            className="w-full"
            asChild
          >
            <Link href={actionLink}>
              <span>Accesează</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}