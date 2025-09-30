/**
 * BPM Automations Page
 * 
 * Pagina pentru gestionarea automatizărilor
 */

import React from 'react';
import { BPMModuleLayout } from '../../components/common/BPMModuleLayout';
import BPMEmptyState from '../../components/common/BPMEmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cog, FileCog } from 'lucide-react';

export default function AutomationsPage() {
  return (
    <BPMModuleLayout activeTab="automations">
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>Automatizări</CardTitle>
          <CardDescription>
            Configurați automatizări pentru procesele de afaceri care rulează fără intervenție umană
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <BPMEmptyState
            title="Automatizări"
            description="Creați reguli de automatizare pentru procesele de business. Această funcționalitate va fi disponibilă în curând."
            icon={<Cog className="h-10 w-10" />}
            action={{
              label: "Află mai multe",
              onClick: () => window.alert("Automatizările vor fi disponibile în curând!"),
            }}
            variant="default"
            className="max-w-lg"
          />
        </CardContent>
      </Card>
    </BPMModuleLayout>
  );
}