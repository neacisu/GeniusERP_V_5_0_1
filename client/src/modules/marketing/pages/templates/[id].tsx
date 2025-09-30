/**
 * Template Detail Page
 * 
 * Displays details about a specific content template.
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Copy, 
  Check, 
  X, 
  Mail, 
  MessageSquare, 
  Share2, 
  BellRing, 
  ExternalLink,
  Calendar,
  Eye,
  Image
} from "lucide-react";
import { useTemplate } from "../../hooks/useMarketingApi";
import { CampaignType } from "../../types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";

// Format date function
const formatDate = (date: string | Date | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Campaign type icon component
const TemplateTypeIcon = ({ type }: { type: CampaignType }) => {
  switch (type) {
    case CampaignType.EMAIL:
      return <Mail className="h-4 w-4" />;
    case CampaignType.SMS:
      return <MessageSquare className="h-4 w-4" />;
    case CampaignType.SOCIAL:
      return <Share2 className="h-4 w-4" />;
    case CampaignType.PUSH:
      return <BellRing className="h-4 w-4" />;
    case CampaignType.WHATSAPP:
      return <MessageSquare className="h-4 w-4" />;
    case CampaignType.MULTI_CHANNEL:
      return <ExternalLink className="h-4 w-4" />;
    default:
      return <Mail className="h-4 w-4" />;
  }
};

interface TemplateDetailPageProps {
  id: string;
}

const TemplateDetailPage: React.FC<TemplateDetailPageProps> = ({ id }) => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { template, isLoading, updateTemplate, deleteTemplate } = useTemplate(id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Handle template deletion
  const handleDeleteTemplate = async () => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast({
        title: "Șablon șters",
        description: "Șablonul a fost șters cu succes.",
      });
      navigate("/marketing/templates");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la ștergerea șablonului.",
        variant: "destructive"
      });
    }
  };
  
  // Handle template status toggle
  const handleToggleStatus = async () => {
    if (!template) return;
    
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        data: { isActive: !template.isActive }
      });
      
      toast({
        title: "Status actualizat",
        description: `Șablonul a fost ${!template.isActive ? 'activat' : 'dezactivat'} cu succes.`,
      });
    } catch (error) {
      console.error("Error toggling template status:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la actualizarea statusului șablonului.",
        variant: "destructive"
      });
    }
  };
  
  // Handle template duplication
  const handleDuplicateTemplate = () => {
    toast({
      title: "Acțiune în dezvoltare",
      description: "Funcționalitatea de duplicare a șablonului va fi disponibilă în curând.",
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-9 w-64" />
        </div>
        
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-24" />
        </div>
        
        <Skeleton className="h-[400px] w-full" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-1" />
          <Skeleton className="h-64 col-span-2" />
        </div>
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="flex-1 space-y-4 p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/marketing">Marketing</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/marketing/templates">Șabloane</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Eroare</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <X className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Șablon negăsit</h2>
            <p className="text-muted-foreground text-center">
              Șablonul pe care încercați să îl vizualizați nu există sau a fost șters.
            </p>
            <Button onClick={() => navigate("/marketing/templates")}>
              Înapoi la lista de șabloane
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/marketing">Marketing</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/marketing/templates">Șabloane</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{template.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate("/marketing/templates")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Înapoi</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
            <div className="flex items-center mt-1 space-x-2">
              <div className="flex items-center text-muted-foreground">
                <TemplateTypeIcon type={template.type} />
                <span className="ml-1">
                  {template.type === CampaignType.EMAIL 
                    ? 'Email' 
                    : template.type === CampaignType.SMS 
                      ? 'SMS' 
                      : template.type === CampaignType.SOCIAL 
                        ? 'Social Media'
                        : template.type === CampaignType.PUSH
                          ? 'Push Notificare'
                          : template.type === CampaignType.WHATSAPP
                            ? 'WhatsApp'
                            : 'Multi-canal'
                  }
                </span>
              </div>
              <span className="text-muted-foreground">•</span>
              <Badge variant="outline" className={
                template.isActive 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
              }>
                {template.isActive ? 'Activ' : 'Inactiv'}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleToggleStatus}>
            {template.isActive ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Dezactivează
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Activează
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleDuplicateTemplate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplică
          </Button>
          <Button variant="outline" onClick={() => navigate(`/marketing/templates/edit/${id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editează
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Șterge
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList>
          <TabsTrigger value="preview">Previzualizare</TabsTrigger>
          <TabsTrigger value="details">Detalii</TabsTrigger>
          <TabsTrigger value="usage">Utilizare</TabsTrigger>
        </TabsList>
        
        {/* Preview tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Previzualizare Șablon</CardTitle>
              <CardDescription>
                Vizualizați cum arată șablonul dvs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {template.type === CampaignType.EMAIL ? (
                <div className="border rounded-md p-6 bg-card shadow-sm">
                  {template.previewImage ? (
                    <div className="aspect-auto max-h-[600px] w-full overflow-auto bg-white rounded-md border shadow-sm">
                      <img 
                        src={template.previewImage} 
                        alt={template.name} 
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-md">
                      <div className="text-center p-6">
                        <Image className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <h3 className="text-lg font-medium">Fără previzualizare</h3>
                        <p className="text-muted-foreground">
                          Nu există o imagine de previzualizare pentru acest șablon.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Subiect:</h3>
                      <p className="text-base">{template.subject || 'Fără subiect'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Conținut:</h3>
                      <div className="bg-muted rounded-md p-4 whitespace-pre-wrap">
                        {template.content || 'Fără conținut'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : template.type === CampaignType.SMS || template.type === CampaignType.WHATSAPP ? (
                <div className="max-w-sm mx-auto">
                  <div className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                    <div className="bg-white rounded-md p-4 shadow-sm">
                      <p className="whitespace-pre-wrap text-sm">
                        {template.content || 'Fără conținut'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-6 bg-card">
                  <p className="text-muted-foreground">
                    Previzualizarea pentru acest tip de șablon nu este disponibilă.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Details tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Informații Șablon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">ID:</h3>
                  <p className="text-sm font-mono">{template.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Tip:</h3>
                  <div className="flex items-center">
                    <TemplateTypeIcon type={template.type} />
                    <span className="ml-1">
                      {template.type === CampaignType.EMAIL 
                        ? 'Email' 
                        : template.type === CampaignType.SMS 
                          ? 'SMS' 
                          : template.type === CampaignType.SOCIAL 
                            ? 'Social Media'
                            : template.type === CampaignType.PUSH
                              ? 'Push Notificare'
                              : template.type === CampaignType.WHATSAPP
                                ? 'WhatsApp'
                                : 'Multi-canal'
                      }
                    </span>
                  </div>
                </div>
                
                {template.category && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Categorie:</h3>
                    <p>{template.category}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status:</h3>
                  <Badge variant="outline" className={
                    template.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }>
                    {template.isActive ? 'Activ' : 'Inactiv'}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Creat:</h3>
                  <p>{formatDate(template.createdAt)}</p>
                </div>
                
                {template.updatedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Actualizat:</h3>
                    <p>{formatDate(template.updatedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Descriere și Conținut</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Descriere:</h3>
                  <p className="whitespace-pre-wrap">
                    {template.description || 'Fără descriere'}
                  </p>
                </div>
                
                {template.subject && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Subiect:</h3>
                    <p>{template.subject}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Conținut:</h3>
                  <div className="bg-muted rounded-md p-4 whitespace-pre-wrap">
                    {template.content || 'Fără conținut'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Usage tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilizare Șablon</CardTitle>
              <CardDescription>
                Informații despre utilizarea acestui șablon în campaniile de marketing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-medium">Statistici în dezvoltare</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Statisticile de utilizare ale șablonului vor fi disponibile în curând.
                  Veți putea vedea toate campaniile care utilizează acest șablon și performanța lor.
                </p>
                <Button variant="outline" onClick={() => navigate("/marketing/campaigns/new?templateId=" + id)}>
                  Creează o campanie cu acest șablon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmă ștergerea</DialogTitle>
            <DialogDescription>
              Sunteți sigur că doriți să ștergeți acest șablon? Această acțiune nu poate fi anulată și poate afecta campaniile care folosesc acest șablon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateDetailPage;