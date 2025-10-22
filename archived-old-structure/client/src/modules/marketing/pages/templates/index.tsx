/**
 * Templates Page
 * 
 * Displays and manages content templates for marketing campaigns.
 */

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  MoreHorizontal,
  RefreshCw,
  Edit,
  Trash,
  Copy,
  FileText,
  CheckCircle,
  XCircle,
  Mail,
  MessageSquare,
  Share2,
  BellRing,
  ExternalLink
} from "lucide-react";
import { useTemplates } from "../../hooks/useMarketingApi";
import { CampaignType } from "../../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Format date function
const formatDate = (date: string | Date | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ro-RO');
};

// Template type icon component
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

// Template card component
const TemplateCard = ({ 
  template, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onDuplicate 
}: { 
  template: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDuplicate: (id: string) => void;
}) => {
  return (
    <Card className="overflow-hidden">
      {template.previewImage && (
        <div className="aspect-video w-full relative overflow-hidden bg-muted">
          <img 
            src={template.previewImage} 
            alt={template.name} 
            className="object-cover w-full h-full"
          />
          <Badge 
            className="absolute top-2 right-2"
            variant="outline"
          >
            {template.type === CampaignType.EMAIL ? 'Email' : 
            template.type === CampaignType.SMS ? 'SMS' : 
            template.type === CampaignType.SOCIAL ? 'Social' : 
            template.type === CampaignType.PUSH ? 'Push' : 
            template.type === CampaignType.WHATSAPP ? 'WhatsApp' : 
            'Multi-canal'}
          </Badge>
        </div>
      )}
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <TemplateTypeIcon type={template.type} />
            <CardTitle className="ml-2 text-lg">{template.name}</CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
          >
            {template.isActive ? 'Activ' : 'Inactiv'}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 mt-1">
          {template.description || 'Fără descriere'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-muted-foreground">
          {template.category && (
            <div className="mb-1">
              <span className="font-medium">Categorie:</span> {template.category}
            </div>
          )}
          <div>
            <span className="font-medium">Creat:</span> {formatDate(template.createdAt)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/marketing/templates/${template.id}`}>
            Vizualizare
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Acțiuni</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel>Acțiuni șablon</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/marketing/templates/${template.id}`}>
                <FileText className="h-4 w-4 mr-2" />
                Vizualizare
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/marketing/templates/edit/${template.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Editare
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => onToggleStatus(template.id, !!template.isActive)}>
              {template.isActive ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Dezactivează
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activează
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href={`/marketing/campaigns/new?templateId=${template.id}`}>
                <Mail className="h-4 w-4 mr-2" />
                Creează campanie
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplică
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(template.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              Șterge
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

const TemplatesPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<CampaignType | "">("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
  // Fetch templates with filters
  const { 
    templates, 
    total, 
    page, 
    pageSize, 
    totalPages,
    isLoading, 
    deleteTemplate,
    updateTemplate
  } = useTemplates({
    type: selectedType as CampaignType | undefined,
    category: selectedCategory || undefined,
    isActive,
    search: searchQuery,
    page: currentPage,
    pageSize: 9
  });
  
  // Handle filter apply
  const applyFilters = () => {
    setCurrentPage(1);
    setIsFilterSheetOpen(false);
  };
  
  // Handle filter reset
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedType("");
    setSelectedCategory("");
    setIsActive(undefined);
    setCurrentPage(1);
  };
  
  // Handle template deletion
  const handleDeleteTemplate = (id: string) => {
    setTemplateToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteTemplate = async () => {
    if (templateToDelete) {
      await deleteTemplate.mutateAsync(templateToDelete);
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };
  
  // Handle template status toggle
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateTemplate.mutateAsync({
        id,
        data: { isActive: !currentStatus }
      });
      toast({
        title: "Status actualizat",
        description: `Șablonul a fost ${!currentStatus ? 'activat' : 'dezactivat'} cu succes.`,
      });
    } catch (error) {
      console.error("Error toggling template status:", error);
    }
  };
  
  // Handle template duplication
  const handleDuplicateTemplate = (id: string) => {
    toast({
      title: "Acțiune în dezvoltare",
      description: "Funcționalitatea de duplicare a șablonului va fi disponibilă în curând.",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Șabloane</h1>
        <Button asChild>
          <Link href="/marketing/templates/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Șablon nou
          </Link>
        </Button>
      </div>
      
      {/* Type Tabs for quick filtering */}
      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => {
        if (value === "all") {
          setSelectedType("");
        } else {
          setSelectedType(value as CampaignType);
        }
        setCurrentPage(1);
      }}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 w-full">
          <TabsTrigger value="all">Toate</TabsTrigger>
          <TabsTrigger value={CampaignType.EMAIL}>Email</TabsTrigger>
          <TabsTrigger value={CampaignType.SMS}>SMS</TabsTrigger>
          <TabsTrigger value={CampaignType.SOCIAL}>Social</TabsTrigger>
          <TabsTrigger value={CampaignType.PUSH} className="hidden lg:flex">Push</TabsTrigger>
          <TabsTrigger value={CampaignType.WHATSAPP} className="hidden lg:flex">WhatsApp</TabsTrigger>
          <TabsTrigger value={CampaignType.MULTI_CHANNEL} className="hidden lg:flex">Multi-canal</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută șabloane..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline">Filtre</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filtrare șabloane</SheetTitle>
                <SheetDescription>
                  Aplicați filtre pentru a găsi șabloanele dorite.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tip</label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) => setSelectedType(value as CampaignType | "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează tip" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toate</SelectItem>
                      <SelectItem value={CampaignType.EMAIL}>Email</SelectItem>
                      <SelectItem value={CampaignType.SMS}>SMS</SelectItem>
                      <SelectItem value={CampaignType.SOCIAL}>Social Media</SelectItem>
                      <SelectItem value={CampaignType.PUSH}>Push Notificare</SelectItem>
                      <SelectItem value={CampaignType.WHATSAPP}>WhatsApp</SelectItem>
                      <SelectItem value={CampaignType.MULTI_CHANNEL}>Multi-canal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categorie</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toate</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="promotional">Promoțional</SelectItem>
                      <SelectItem value="transactional">Tranzacțional</SelectItem>
                      <SelectItem value="announcement">Anunț</SelectItem>
                      <SelectItem value="event">Eveniment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isActive === true}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setIsActive(true);
                        } else if (isActive === true) {
                          setIsActive(undefined);
                        } else {
                          setIsActive(false);
                        }
                      }}
                    />
                    <Label>Doar șabloane active</Label>
                  </div>
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline" onClick={resetFilters}>Resetează</Button>
                </SheetClose>
                <Button onClick={applyFilters}>Aplică filtre</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          
          <Button variant="outline" onClick={() => setCurrentPage(1)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Actualizează</span>
          </Button>
        </div>
      </div>
      
      {/* Templates Grid */}
      <div>
        {isLoading ? (
          // Loading skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, idx) => (
              <Card key={idx}>
                <div className="aspect-video w-full bg-muted">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardHeader className="p-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-4 w-24" />
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-9" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : templates.length === 0 ? (
          // Empty state
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <CardTitle>Nu există șabloane</CardTitle>
              <CardDescription>
                Nu există șabloane care să corespundă filtrelor aplicate. Creați un șablon nou sau încercați alte filtre.
              </CardDescription>
              <Button asChild className="mt-2">
                <Link href="/marketing/templates/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Șablon nou
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          // Templates grid
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={(id) => navigate(`/marketing/templates/edit/${id}`)}
                  onDelete={handleDeleteTemplate}
                  onToggleStatus={handleToggleStatus}
                  onDuplicate={handleDuplicateTemplate}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <div className="flex items-center mx-4">
                  <span className="text-sm text-muted-foreground">
                    Pagina {currentPage} din {totalPages}
                  </span>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Următor
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
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
            <Button variant="destructive" onClick={confirmDeleteTemplate}>
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesPage;