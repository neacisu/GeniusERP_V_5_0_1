import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from '@/lib/utils';
import { IntegrationStatus } from '../../hooks/integrations/useIntegrations';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status: IntegrationStatus;
  lastSynced?: string | null;
  onConfigure: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  className?: string;
}

export default function IntegrationCard({
  title,
  description,
  icon: Icon,
  status,
  lastSynced,
  onConfigure,
  onActivate,
  onDeactivate,
  className
}: IntegrationCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case IntegrationStatus.ACTIVE:
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Activ
          </Badge>
        );
      case IntegrationStatus.INACTIVE:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Inactiv
          </Badge>
        );
      case IntegrationStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">
            <Clock className="w-3.5 h-3.5 mr-1" />
            În așteptare
          </Badge>
        );
      case IntegrationStatus.ERROR:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 border-0">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Eroare
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Niciodată';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {lastSynced && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Ultima sincronizare:</span> {formatDate(lastSynced)}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onConfigure}>
          <Link2 className="mr-2 h-4 w-4" />
          Configurare
        </Button>
        
        <div>
          {status === IntegrationStatus.ACTIVE && onDeactivate && (
            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onDeactivate}>
              Dezactivare
            </Button>
          )}
          
          {(status === IntegrationStatus.INACTIVE || status === IntegrationStatus.ERROR) && onActivate && (
            <Button variant="default" onClick={onActivate}>
              Activare
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}