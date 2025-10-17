/**
 * BPM Scheduler Page
 * 
 * Pagina pentru planificarea proceselor automate
 */

import React from 'react';
import { BPMModuleLayout } from '../../components/common/BPMModuleLayout';
import BPMEmptyState from '../../components/common/BPMEmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function SchedulerPage() {
  return (
    <BPMModuleLayout activeTab="scheduler">
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>Planificator</CardTitle>
          <CardDescription>
            Programați execuția automată a proceselor la intervale specificate
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <BPMEmptyState
            title="Planificator Procese"
            description="Planificați execuția automată a proceselor la intervale specifice sau la anumite momente. Această funcționalitate va fi disponibilă în curând."
            icon={<Clock className="h-10 w-10" />}
            action={{
              label: "Află despre programare",
              onClick: () => window.alert("Planificatorul de procese va fi disponibil în curând!"),
            }}
            variant="inline"
            className="max-w-lg"
          />
        </CardContent>
      </Card>
    </BPMModuleLayout>
  );
}