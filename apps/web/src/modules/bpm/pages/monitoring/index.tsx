/**
 * BPM Monitoring Page
 * 
 * Pagina pentru monitorizarea proceselor active
 */

import React from 'react';
import { BPMModuleLayout } from '../../components/common/BPMModuleLayout';
import BPMEmptyState from '../../components/common/BPMEmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from 'lucide-react';

export default function MonitoringPage() {
  return (
    <BPMModuleLayout activeTab="monitoring">
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>Monitorizare Procese</CardTitle>
          <CardDescription>
            Monitorizați performanța și statusul proceselor active
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <BPMEmptyState
            title="Monitorizare în Timp Real"
            description="Urmăriți performanța proceselor și identificați blocajele. Această funcționalitate va fi disponibilă în curând."
            icon={<Gauge className="h-10 w-10" />}
            action={{
              label: "Înțelege monitorizarea",
              onClick: () => window.alert("Monitorizarea avansată va fi disponibilă în curând!"),
            }}
            variant="inline"
            className="max-w-lg"
          />
        </CardContent>
      </Card>
    </BPMModuleLayout>
  );
}