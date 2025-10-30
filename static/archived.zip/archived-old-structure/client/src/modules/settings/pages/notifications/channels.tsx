/**
 * Notification Channels Settings Page
 * 
 * This page allows users to configure and manage different notification channels.
 */

import React, { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SettingCard from "../../components/cards/SettingCard";
import FormSection from "../../components/forms/FormSection";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  MessageSquare,
  Phone,
  BellRing,
  Slack,
  Smartphone,
  Radio
} from "lucide-react";

export default function NotificationChannelsPage() {
  // State pentru canalele de notificare
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);

  // State pentru configurări email
  const [emailSender, setEmailSender] = useState("system@yourcompany.com");
  const [emailProvider, setEmailProvider] = useState("smtp");

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Canale de Notificare"
        description="Configurați canalele prin care vor fi livrate notificările."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Notificări", href: "/settings/notifications" },
          { title: "Canale" }
        ]}
      />

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Canale Active</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="push">Push</TabsTrigger>
          <TabsTrigger value="integrations">Integrări</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <SettingCard
            title="Canale Disponibile"
            description="Activați sau dezactivați canalele prin care doriți să primiți notificări."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="flex items-center space-x-4">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">
                      Trimite notificări către adresele de email configurate.
                    </div>
                  </div>
                </div>
                <Switch 
                  checked={emailEnabled} 
                  onCheckedChange={setEmailEnabled} 
                />
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="flex items-center space-x-4">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">SMS</div>
                    <div className="text-sm text-muted-foreground">
                      Trimite mesaje text către numerele de telefon configurate.
                    </div>
                  </div>
                </div>
                <Switch 
                  checked={smsEnabled} 
                  onCheckedChange={setSmsEnabled} 
                />
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="flex items-center space-x-4">
                  <BellRing className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Notificări Push</div>
                    <div className="text-sm text-muted-foreground">
                      Trimite notificări push către browsere și aplicații mobile.
                    </div>
                  </div>
                </div>
                <Switch 
                  checked={pushEnabled} 
                  onCheckedChange={setPushEnabled} 
                />
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="flex items-center space-x-4">
                  <Slack className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Slack</div>
                    <div className="text-sm text-muted-foreground">
                      Trimite notificări către canalele Slack configurate.
                    </div>
                  </div>
                </div>
                <Switch 
                  checked={slackEnabled} 
                  onCheckedChange={setSlackEnabled} 
                />
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="flex items-center space-x-4">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Telegram</div>
                    <div className="text-sm text-muted-foreground">
                      Trimite notificări către conturile Telegram conectate.
                    </div>
                  </div>
                </div>
                <Switch 
                  checked={telegramEnabled} 
                  onCheckedChange={setTelegramEnabled} 
                />
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <SettingCard
            title="Configurare Email"
            description="Configurați setările pentru notificările prin email."
          >
            <FormSection 
              title="Setări Provider" 
              description="Configurați serviciul de email folosit pentru trimiterea notificărilor"
              columns={2}
            >
              <div className="space-y-2">
                <Label htmlFor="email-provider">Provider Email</Label>
                <Select value={emailProvider} onValueChange={setEmailProvider}>
                  <SelectTrigger id="email-provider">
                    <SelectValue placeholder="Selectați provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">Server SMTP</SelectItem>
                    <SelectItem value="mailchimp">Mailchimp</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender-email">Email Expeditor</Label>
                <Input 
                  id="sender-email" 
                  value={emailSender} 
                  onChange={(e) => setEmailSender(e.target.value)} 
                  placeholder="notifications@yourcompany.com" 
                />
              </div>
            </FormSection>

            {emailProvider === "smtp" && (
              <FormSection 
                title="Configurare SMTP" 
                description="Configurați detaliile serverului SMTP"
                columns={2}
              >
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">Server SMTP</Label>
                  <Input id="smtp-host" placeholder="smtp.yourcompany.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Port SMTP</Label>
                  <Input id="smtp-port" placeholder="587" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Utilizator SMTP</Label>
                  <Input id="smtp-user" placeholder="username" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Parolă SMTP</Label>
                  <Input id="smtp-password" type="password" placeholder="••••••••" />
                </div>
              </FormSection>
            )}

            <div className="flex justify-end mt-6 space-x-2">
              <Button variant="outline">
                Testează Conexiune
              </Button>
              <Button>
                Salvează Configurare
              </Button>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <SettingCard
            title="Configurare SMS"
            description="Configurați serviciul de SMS pentru notificări."
          >
            <FormSection 
              title="Provider SMS" 
              description="Configurați serviciul folosit pentru trimiterea SMS-urilor"
              columns={2}
            >
              <div className="space-y-2">
                <Label htmlFor="sms-provider">Provider SMS</Label>
                <Select defaultValue="twilio">
                  <SelectTrigger id="sms-provider">
                    <SelectValue placeholder="Selectați provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="nexmo">Nexmo (Vonage)</SelectItem>
                    <SelectItem value="messagebird">MessageBird</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender-number">Număr Expeditor</Label>
                <Input 
                  id="sender-number" 
                  placeholder="+40721234567" 
                />
              </div>
            </FormSection>

            <FormSection 
              title="Credențiale API" 
              description="Configurați credențialele pentru serviciul SMS"
              columns={2}
            >
              <div className="space-y-2">
                <Label htmlFor="sms-api-key">API Key</Label>
                <Input id="sms-api-key" placeholder="API Key" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms-api-secret">API Secret</Label>
                <Input id="sms-api-secret" type="password" placeholder="••••••••" />
              </div>
            </FormSection>

            <div className="flex justify-end mt-6 space-x-2">
              <Button variant="outline">
                Testează SMS
              </Button>
              <Button>
                Salvează Configurare
              </Button>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="push" className="space-y-4">
          <SettingCard
            title="Configurare Notificări Push"
            description="Configurați serviciul de notificări push."
          >
            <FormSection 
              title="Provider Notificări Push" 
              description="Configurați serviciul folosit pentru trimiterea notificărilor push"
              columns={1}
            >
              <div className="space-y-2">
                <Label htmlFor="push-provider">Provider Push</Label>
                <Select defaultValue="firebase">
                  <SelectTrigger id="push-provider">
                    <SelectValue placeholder="Selectați provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="firebase">Firebase Cloud Messaging</SelectItem>
                    <SelectItem value="onesignal">OneSignal</SelectItem>
                    <SelectItem value="browser">Notificări Browser Native</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormSection>

            <FormSection 
              title="Configurare Firebase" 
              description="Introduceți detaliile proiectului Firebase"
              columns={2}
            >
              <div className="space-y-2">
                <Label htmlFor="firebase-project-id">ID Proiect</Label>
                <Input id="firebase-project-id" placeholder="your-project-id" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firebase-api-key">API Key</Label>
                <Input id="firebase-api-key" placeholder="API Key" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firebase-app-id">ID Aplicație</Label>
                <Input id="firebase-app-id" placeholder="ID Aplicație" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firebase-messaging-id">ID Messaging</Label>
                <Input id="firebase-messaging-id" placeholder="ID Messaging" />
              </div>
            </FormSection>

            <div className="flex justify-end mt-6 space-x-2">
              <Button variant="outline">
                Testează Notificare
              </Button>
              <Button>
                Salvează Configurare
              </Button>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <SettingCard
            title="Integrări Notificări"
            description="Configurați integrările cu servicii externe pentru notificări."
          >
            <FormSection 
              title="Integrare Slack" 
              description="Conectați aplicația la canalele Slack pentru notificări"
              columns={1}
            >
              <div className="space-y-2">
                <Label htmlFor="slack-webhook">Webhook URL</Label>
                <Input id="slack-webhook" placeholder="https://hooks.slack.com/services/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slack-channel">Canal Implicit</Label>
                <Input id="slack-channel" placeholder="#general" />
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 mt-2">
                <div className="space-y-0.5">
                  <div className="font-medium">Integrare Activă</div>
                  <div className="text-sm text-muted-foreground">
                    Activează trimiterea notificărilor către Slack
                  </div>
                </div>
                <Switch checked={slackEnabled} onCheckedChange={setSlackEnabled} />
              </div>
            </FormSection>

            <FormSection 
              title="Integrare Telegram" 
              description="Configurați botul Telegram pentru notificări"
              columns={1}
            >
              <div className="space-y-2">
                <Label htmlFor="telegram-token">Token Bot</Label>
                <Input id="telegram-token" placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram-chat">ID Chat</Label>
                <Input id="telegram-chat" placeholder="-1001234567890" />
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 mt-2">
                <div className="space-y-0.5">
                  <div className="font-medium">Integrare Activă</div>
                  <div className="text-sm text-muted-foreground">
                    Activează trimiterea notificărilor către Telegram
                  </div>
                </div>
                <Switch checked={telegramEnabled} onCheckedChange={setTelegramEnabled} />
              </div>
            </FormSection>

            <div className="flex justify-end mt-6 space-x-2">
              <Button variant="outline">
                Testează Integrări
              </Button>
              <Button>
                Salvează Integrări
              </Button>
            </div>
          </SettingCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}