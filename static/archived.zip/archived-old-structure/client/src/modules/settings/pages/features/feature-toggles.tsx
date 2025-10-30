/**
 * Feature Toggles Settings Page
 * 
 * Page for managing feature flags and toggles for different modules
 */

import React, { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Loader2, PlusCircle, Search } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import SettingCard from "../../components/cards/SettingCard";
import { useSettingsApi, type FeatureToggle } from "../../hooks/useSettingsApi";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function FeatureTogglesPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");
  const [isNewFeatureDialogOpen, setIsNewFeatureDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    feature: "",
    module: "",
    description: "",
    enabled: false
  });

  const { user } = useUser();
  const { 
    useFeatureToggles, 
    useCreateFeatureToggle,
    useEnableFeature,
    useDisableFeature
  } = useSettingsApi();

  const { data: features, isLoading } = useFeatureToggles(
    selectedModule !== "all" ? selectedModule : undefined,
    user?.companyId
  );

  const createFeatureMutation = useCreateFeatureToggle();
  const enableFeatureMutation = useEnableFeature();
  const disableFeatureMutation = useDisableFeature();

  // Filter features based on search term
  const filteredFeatures = features?.filter(feature => 
    feature.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique modules for filtering
  const modules = features ? 
    Array.from(new Set(features.map(feature => feature.module))) : 
    [];

  // Handle toggle change
  const handleToggleChange = (feature: FeatureToggle, enabled: boolean) => {
    if (!user?.id) return;
    
    if (enabled) {
      enableFeatureMutation.mutate({ id: feature.id, userId: user.id });
    } else {
      disableFeatureMutation.mutate({ id: feature.id, userId: user.id });
    }
  };

  // Handle creating a new feature toggle
  const handleCreateFeature = () => {
    if (!user?.companyId) return;
    
    createFeatureMutation.mutate({
      ...newFeature,
      companyId: user.companyId,
      metadata: {}
    });
    
    setIsNewFeatureDialogOpen(false);
    setNewFeature({
      feature: "",
      module: "",
      description: "",
      enabled: false
    });
  };

  // Feature creation dialog
  const featureDialog = (
    <Dialog open={isNewFeatureDialogOpen} onOpenChange={setIsNewFeatureDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adaugă Funcționalitate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adaugă o nouă funcționalitate</DialogTitle>
          <DialogDescription>
            Creează un nou feature toggle pentru a activa sau dezactiva funcționalități.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="feature" className="text-right">
              Nume
            </Label>
            <Input
              id="feature"
              placeholder="ex: enable_export_pdf"
              className="col-span-3"
              value={newFeature.feature}
              onChange={(e) => setNewFeature({...newFeature, feature: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="module" className="text-right">
              Modul
            </Label>
            <Input
              id="module"
              placeholder="ex: invoicing"
              className="col-span-3"
              value={newFeature.module}
              onChange={(e) => setNewFeature({...newFeature, module: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descriere
            </Label>
            <Input
              id="description"
              placeholder="Funcționalitate pentru export PDF"
              className="col-span-3"
              value={newFeature.description}
              onChange={(e) => setNewFeature({...newFeature, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="enabled" className="text-right">
              Activat
            </Label>
            <div className="col-span-3">
              <Switch
                id="enabled"
                checked={newFeature.enabled}
                onCheckedChange={(checked) => setNewFeature({...newFeature, enabled: checked})}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleCreateFeature}
            disabled={!newFeature.feature || !newFeature.module || createFeatureMutation.isPending}
          >
            {createFeatureMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se creează...
              </>
            ) : (
              "Salvează"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Table of feature toggles
  const featureTable = (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcționalitate</TableHead>
            <TableHead>Modul</TableHead>
            <TableHead>Descriere</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredFeatures && filteredFeatures.length > 0 ? (
            filteredFeatures.map((feature) => (
              <TableRow key={feature.id}>
                <TableCell className="font-medium">{feature.feature}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {feature.module}
                  </Badge>
                </TableCell>
                <TableCell>{feature.description || "Nicio descriere"}</TableCell>
                <TableCell>
                  <Badge 
                    variant={feature.isEnabled ? "default" : "secondary"}
                    className={`font-normal ${feature.isEnabled ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
                  >
                    {feature.isEnabled ? "Activat" : "Dezactivat"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={feature.isEnabled}
                    onCheckedChange={(checked) => handleToggleChange(feature, checked)}
                    disabled={enableFeatureMutation.isPending || disableFeatureMutation.isPending}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {searchTerm ? (
                  "Nu au fost găsite funcționalități care să corespundă căutării."
                ) : (
                  "Nu există funcționalități configurate."
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Funcționalități (Feature Toggles)"
        description="Activați sau dezactivați funcționalități în aplicație."
        breadcrumbs={[{ title: "Funcționalități" }]}
        actions={featureDialog}
      />

      <SettingCard
        title="Funcționalități disponibile"
        description="Gestionați funcționalitățile disponibile în aplicație prin activarea sau dezactivarea lor."
      >
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Căutare funcționalități..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs 
              defaultValue="all" 
              value={selectedModule} 
              onValueChange={setSelectedModule}
              className="w-full md:w-auto"
            >
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="all">Toate</TabsTrigger>
                {modules.map(module => (
                  <TabsTrigger key={module} value={module}>
                    {module.charAt(0).toUpperCase() + module.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            featureTable
          )}
        </div>
      </SettingCard>
    </div>
  );
}

// Export the main component directly 
export default function FeatureTogglesPage() {
  return <FeatureTogglesPageContent />;
}