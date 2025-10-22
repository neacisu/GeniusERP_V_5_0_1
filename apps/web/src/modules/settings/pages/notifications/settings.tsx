/**
 * Notifications Settings Page
 * 
 * Manages notification configurations and channels
 */

import React, { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SettingCard from "../../components/cards/SettingCard";
import FormSection from "../../components/forms/FormSection";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  AlertTriangle
} from "lucide-react";

export default function NotificationsSettingsPage() {
  // Starea pentru setările de notificări
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState("instant");

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Setări Notificări"
        description="Configurați setările de notificări la nivel de sistem."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Notificări", href: "/settings/notifications" },
          { title: "Setări Generale" }
        ]}
      />

      <SettingCard
        title="Setări Notificări"
        description="Configurați notificările la nivel de sistem și canalele de comunicare."
      >
        <FormSection 
          title="Canale de Notificare" 
          description="Configurați cum doriți să primiți notificările"
          columns={1}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Notificări Email</div>
                  <div className="text-sm text-muted-foreground">
                    Primiți notificări pe adresa de email.
                  </div>
                </div>
              </div>
              <Switch 
                checked={emailNotifications} 
                onCheckedChange={setEmailNotifications} 
              />
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Notificări SMS</div>
                  <div className="text-sm text-muted-foreground">
                    Primiți notificări prin SMS pe telefonul mobil.
                  </div>
                </div>
              </div>
              <Switch 
                checked={smsNotifications} 
                onCheckedChange={setSmsNotifications} 
              />
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Notificări Push</div>
                  <div className="text-sm text-muted-foreground">
                    Primiți notificări push pe dispozitive.
                  </div>
                </div>
              </div>
              <Switch 
                checked={pushNotifications} 
                onCheckedChange={setPushNotifications} 
              />
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Notificări în Aplicație</div>
                  <div className="text-sm text-muted-foreground">
                    Primiți notificări în interiorul aplicației.
                  </div>
                </div>
              </div>
              <Switch 
                checked={inAppNotifications} 
                onCheckedChange={setInAppNotifications} 
              />
            </div>
          </div>
        </FormSection>

        <FormSection 
          title="Frecvență Notificări" 
          description="Configurați cât de des doriți să primiți notificările pe email"
          columns={1}
        >
          <div className="rounded-lg border p-4">
            <RadioGroup 
              value={emailFrequency} 
              onValueChange={setEmailFrequency}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="instant" id="instant" />
                <Label htmlFor="instant">Instant</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily">Sumar zilnic</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly">Sumar săptămânal</Label>
              </div>
            </RadioGroup>
          </div>
        </FormSection>

        <FormSection 
          title="Tipuri de Notificări" 
          description="Ajustați pentru ce evenimente doriți să primiți notificări"
          columns={2}
        >
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div className="space-y-0.5">
                  <div className="font-medium">Alerte de Sistem</div>
                  <div className="text-sm text-muted-foreground">
                    Notificări pentru probleme critice
                  </div>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div className="space-y-0.5">
                  <div className="font-medium">Mementouri</div>
                  <div className="text-sm text-muted-foreground">
                    Notificări pentru evenimente viitoare
                  </div>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Mail className="h-5 w-5 text-green-500" />
                <div className="space-y-0.5">
                  <div className="font-medium">Mesaje Noi</div>
                  <div className="text-sm text-muted-foreground">
                    Notificări pentru mesaje noi primite
                  </div>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Bell className="h-5 w-5 text-purple-500" />
                <div className="space-y-0.5">
                  <div className="font-medium">Actualizări Sistem</div>
                  <div className="text-sm text-muted-foreground">
                    Notificări pentru actualizări de sistem
                  </div>
                </div>
              </div>
              <Switch defaultChecked={false} />
            </div>
          </div>
        </FormSection>

        <div className="flex justify-end mt-6 space-x-2">
          <Button variant="outline">
            Resetează Setări
          </Button>
          <Button>
            Salvare Setări
          </Button>
        </div>

        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground mt-4 text-center">
          Notă: Unele setări de notificări vor fi disponibile în versiunea viitoare a aplicației.
        </div>
      </SettingCard>
    </div>
  );
}