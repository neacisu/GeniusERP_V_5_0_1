/**
 * BPM Integrations Page
 * 
 * Pagina pentru gestionarea integrărilor cu sisteme externe
 */

import React from 'react';
import { BPMModuleLayout } from '../../components/common/BPMModuleLayout';
import BPMEmptyState from '../../components/common/BPMEmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <BPMModuleLayout activeTab="integrations">
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>Integrări</CardTitle>
          <CardDescription>
            Conectați procesele de business cu sisteme externe și APIs
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <BPMEmptyState
            title="Integrări cu Sisteme Externe"
            description="Creați integrări între procesele BPM și alte sisteme interne sau externe. Această secțiune va fi disponibilă în curând."
            icon={<Share2 className="h-10 w-10" />}
            action={{
              label: "Explorează posibilități",
              onClick: () => window.alert("Integrările vor fi disponibile în curând!"),
            }}
            variant="default"
            className="max-w-lg"
          />
        </CardContent>
      </Card>
    </BPMModuleLayout>
  );
}