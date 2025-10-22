/**
 * Security Settings Page
 * 
 * Manages security configurations and policies
 */

import React from "react";
import PageHeader from "../../components/common/PageHeader";
import SettingCard from "../../components/cards/SettingCard";
import FormSection from "../../components/forms/FormSection";
import { Button } from "@/components/ui/button";
import { Shield, KeyRound, UserRound, History, AlertTriangle } from "lucide-react";

export default function SecuritySettingsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Securitate"
        description="Configurați setările de securitate ale aplicației."
        breadcrumbs={[{ title: "Securitate" }]}
      />

      <SettingCard
        title="Setări Securitate"
        description="Gestionați politicile de securitate, autentificare și autorizare."
      >
        <FormSection 
          title="Politici Parole" 
          description="Configurați cerințele pentru parole și expirarea acestora"
          columns={1}
        >
          <div className="rounded-lg border bg-card p-6">
            <div className="flex space-x-4 items-start">
              <Shield className="h-8 w-8 text-primary mt-1" />
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Politici de Securitate Parole</h3>
                <p className="text-sm text-muted-foreground">
                  Configurați cerințele de complexitate pentru parolele utilizatorilor, 
                  inclusiv lungimea minimă, cerințele de caractere și politicile de expirare.
                </p>
                <div className="flex pt-2">
                  <Button disabled variant="outline" className="mr-2">Configurare Politici</Button>
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection 
          title="Autentificare în Doi Pași" 
          description="Configurați metode de verificare suplimentare pentru autentificare"
          columns={1}
        >
          <div className="rounded-lg border bg-card p-6">
            <div className="flex space-x-4 items-start">
              <KeyRound className="h-8 w-8 text-primary mt-1" />
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Autentificare în Doi Pași (2FA)</h3>
                <p className="text-sm text-muted-foreground">
                  Activați și configurați autentificarea în doi pași pentru a adăuga un nivel 
                  suplimentar de securitate la conturile utilizatorilor.
                </p>
                <div className="flex pt-2">
                  <Button disabled variant="outline" className="mr-2">Activare 2FA</Button>
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection 
          title="Sesiuni Active" 
          description="Gestionați și monitorizați sesiunile active"
          columns={1}
        >
          <div className="rounded-lg border bg-card p-6">
            <div className="flex space-x-4 items-start">
              <UserRound className="h-8 w-8 text-primary mt-1" />
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Gestionare Sesiuni</h3>
                <p className="text-sm text-muted-foreground">
                  Vizualizați și gestionați toate sesiunile active și dispozitivele conectate. 
                  Deconectați sesiuni din dispozitive nerecunoscute sau vechi.
                </p>
                <div className="flex pt-2">
                  <Button disabled variant="outline" className="mr-2">Vizualizare Sesiuni</Button>
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection 
          title="Istoric Audit" 
          description="Vizualizați istoricul de activitate și acces"
          columns={1}
        >
          <div className="rounded-lg border bg-card p-6">
            <div className="flex space-x-4 items-start">
              <History className="h-8 w-8 text-primary mt-1" />
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Jurnal de Audit</h3>
                <p className="text-sm text-muted-foreground">
                  Consultați jurnalul complet de audit pentru autentificări, modificări de setări 
                  și alte acțiuni importante de securitate.
                </p>
                <div className="flex pt-2">
                  <Button disabled variant="outline" className="mr-2">Vizualizare Jurnal</Button>
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection 
          title="Notificări Securitate" 
          description="Configurați alertele pentru incidente de securitate"
          columns={1}
        >
          <div className="rounded-lg border bg-card p-6">
            <div className="flex space-x-4 items-start">
              <AlertTriangle className="h-8 w-8 text-primary mt-1" />
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Alerte de Securitate</h3>
                <p className="text-sm text-muted-foreground">
                  Configurați notificările pentru incidente de securitate, cum ar fi 
                  conectările din locații noi sau încercări multiple de autentificare eșuate.
                </p>
                <div className="flex pt-2">
                  <Button disabled variant="outline" className="mr-2">Configurare Alerte</Button>
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground mt-4 text-center">
          Notă: Configurarea detaliată a setărilor de securitate va fi disponibilă în versiunea viitoare.
        </div>
      </SettingCard>
    </div>
  );
}