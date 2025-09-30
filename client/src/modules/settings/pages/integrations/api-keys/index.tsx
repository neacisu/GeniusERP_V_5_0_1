/**
 * API Keys Settings Page
 * 
 * Manages API keys for external integrations
 */

import React from "react";
import { KeyRound, PlusCircle, Copy, Eye, EyeOff, Trash2, History } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import SettingCard from "../../../components/cards/SettingCard";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = React.useState([
    {
      id: "1",
      name: "Shopify Integration",
      prefix: "sk_shop_",
      createdAt: "2025-02-15",
      lastUsed: "2025-04-11",
      status: "active",
      expiresAt: "2026-02-15"
    },
    {
      id: "2",
      name: "Payment Gateway",
      prefix: "sk_pay_",
      createdAt: "2025-01-10",
      lastUsed: "2025-04-05",
      status: "active",
      expiresAt: "2026-01-10"
    }
  ]);
  
  const [showKey, setShowKey] = React.useState("");
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState("");
  const [newKeyExpiry, setNewKeyExpiry] = React.useState("1");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ro-RO");
  };

  const generateKeyPrefix = () => {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let result = "sk_";
    for (let i = 0; i < 4; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    result += "_";
    return result;
  };

  const createNewKey = () => {
    if (!newKeyName) return;
    
    const newKey = {
      id: (apiKeys.length + 1).toString(),
      name: newKeyName,
      prefix: generateKeyPrefix(),
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: "-",
      status: "active",
      expiresAt: new Date(Date.now() + parseInt(newKeyExpiry) * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName("");
    setNewKeyExpiry("1");
    setShowCreateDialog(false);
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Chei API"
        description="Gestionați cheile API pentru integrări externe și aplicații."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Integrări", href: "/settings/integrations" },
          { title: "Chei API" }
        ]}
        actions={
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Cheie API Nouă
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Creați o cheie API nouă</DialogTitle>
                <DialogDescription>
                  Cheile API permit accesul la sistemele noastre prin integrări externe.
                  Generați chei doar pentru serviciile în care aveți încredere.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="key-name" className="text-right">
                    Nume
                  </Label>
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="ex: Integrare Shopify"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="key-expiry" className="text-right">
                    Expiră în
                  </Label>
                  <select
                    id="key-expiry"
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="1">1 an</option>
                    <option value="2">2 ani</option>
                    <option value="3">3 ani</option>
                    <option value="5">5 ani</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Anulare
                </Button>
                <Button onClick={createNewKey} disabled={!newKeyName}>
                  Generare Cheie
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <SettingCard
        title="Chei API Active"
        description="Aceste chei API au acces activ la sistemele noastre. Tratați-le ca parole."
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume</TableHead>
                <TableHead>Cheie</TableHead>
                <TableHead>Data Creării</TableHead>
                <TableHead>Ultima Utilizare</TableHead>
                <TableHead>Expiră</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length > 0 ? (
                apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                          <KeyRound className="h-4 w-4 text-primary" />
                        </div>
                        {key.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {showKey === key.id ? (
                        <div className="flex items-center space-x-2">
                          <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                            {key.prefix}••••••••••••••••
                          </code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowKey("")}>
                            <EyeOff className="h-3.5 w-3.5" />
                            <span className="sr-only">Ascunde</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                            {key.prefix}••••••••••••••••
                          </code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowKey(key.id)}>
                            <Eye className="h-3.5 w-3.5" />
                            <span className="sr-only">Afișează</span>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(key.createdAt)}</TableCell>
                    <TableCell>{key.lastUsed === "-" ? "-" : formatDate(key.lastUsed)}</TableCell>
                    <TableCell>{formatDate(key.expiresAt)}</TableCell>
                    <TableCell>
                      {key.status === "active" ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">Activă</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200">Inactivă</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Deschide meniu</span>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${key.prefix}••••••••••••••••`)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiază cheie
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History className="mr-2 h-4 w-4" />
                            Vizualizează activitate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Șterge cheie
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nu există chei API create.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SettingCard>

      <SettingCard
        title="Setări Chei API"
        description="Configurați comportamentul cheilor API și securitatea acestora."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <h3 className="font-medium">Expirare automată</h3>
              <p className="text-sm text-muted-foreground">
                Cheile API vor expira automat după perioada specificată
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <h3 className="font-medium">Rotire automată</h3>
              <p className="text-sm text-muted-foreground">
                Generați automat chei noi înaintea expirării celor existente
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <h3 className="font-medium">Notificări utilizare</h3>
              <p className="text-sm text-muted-foreground">
                Primește notificări privind utilizarea neobișnuită a cheilor API
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </SettingCard>
    </div>
  );
}