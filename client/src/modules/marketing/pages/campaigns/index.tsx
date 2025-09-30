/**
 * Campaigns Page
 * 
 * Displays a list of marketing campaigns with filtering and pagination options.
 */

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  MoreHorizontal,
  RefreshCw,
  Edit,
  Trash,
  Play,
  Pause,
  Copy,
  FileText,
  Send
} from "lucide-react";
import { useCampaigns } from "../../hooks/useMarketingApi";
import { CampaignStatus, CampaignType } from "../../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import MarketingStatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/common/PageHeader";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import DataTable from "../../components/tables/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Status badge component este acum importat din components/common/StatusBadge

// Campaign type label component
const TypeLabel = ({ type }: { type: CampaignType }) => {
  const getTypeLabel = () => {
    switch (type) {
      case CampaignType.EMAIL:
        return 'Email';
      case CampaignType.SMS:
        return 'SMS';
      case CampaignType.SOCIAL:
        return 'Social Media';
      case CampaignType.PUSH:
        return 'Push Notificare';
      case CampaignType.WHATSAPP:
        return 'WhatsApp';
      case CampaignType.MULTI_CHANNEL:
        return 'Multi-canal';
      default:
        return type;
    }
  };

  return getTypeLabel();
};

// Format date function
const formatDate = (date: string | Date | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const CampaignsPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | "">("");
  const [selectedType, setSelectedType] = useState<CampaignType | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  
  // Fetch campaigns with filters
  const { 
    campaigns, 
    total, 
    page, 
    pageSize, 
    totalPages,
    isLoading, 
    deleteCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign
  } = useCampaigns({
    status: selectedStatus as CampaignStatus | undefined,
    type: selectedType as CampaignType | undefined,
    search: searchQuery,
    page: currentPage,
    pageSize: 10
  });
  
  // Handle filter apply
  const applyFilters = () => {
    setCurrentPage(1);
    setIsFilterSheetOpen(false);
  };
  
  // Handle filter reset
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("");
    setSelectedType("");
    setCurrentPage(1);
  };
  
  // Handle campaign deletion
  const handleDeleteCampaign = (id: string) => {
    setCampaignToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteCampaign = async () => {
    if (campaignToDelete) {
      await deleteCampaign.mutateAsync(campaignToDelete);
      setIsDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };
  
  // Handle campaign actions
  const handleStartCampaign = async (id: string) => {
    try {
      await startCampaign.mutateAsync(id);
    } catch (error) {
      console.error("Error starting campaign:", error);
    }
  };
  
  const handlePauseCampaign = async (id: string) => {
    try {
      await pauseCampaign.mutateAsync(id);
    } catch (error) {
      console.error("Error pausing campaign:", error);
    }
  };
  
  const handleResumeCampaign = async (id: string) => {
    try {
      await resumeCampaign.mutateAsync(id);
    } catch (error) {
      console.error("Error resuming campaign:", error);
    }
  };
  
  const handleDuplicateCampaign = (id: string) => {
    toast({
      title: "Acțiune în dezvoltare",
      description: "Funcționalitatea de duplicare a campaniei va fi disponibilă în curând.",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header */}
      <PageHeader 
        title="Campanii"
        description="Gestionați campaniile de marketing"
        breadcrumbs={[
          { label: "Marketing", href: "/marketing" },
          { label: "Campanii" }
        ]}
        actions={
          <Button asChild>
            <Link href="/marketing/campaigns/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Campanie nouă
            </Link>
          </Button>
        }
      />
      
      {/* Tabs for quick filtering */}
      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => {
        if (value === "all") {
          setSelectedStatus("");
        } else {
          setSelectedStatus(value as CampaignStatus);
        }
        setCurrentPage(1);
      }}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
          <TabsTrigger value="all">Toate</TabsTrigger>
          <TabsTrigger value={CampaignStatus.DRAFT}>Ciorne</TabsTrigger>
          <TabsTrigger value={CampaignStatus.SCHEDULED}>Programate</TabsTrigger>
          <TabsTrigger value={CampaignStatus.ACTIVE}>Active</TabsTrigger>
          <TabsTrigger value={CampaignStatus.PAUSED} className="hidden lg:flex">Pausate</TabsTrigger>
          <TabsTrigger value={CampaignStatus.COMPLETED} className="hidden lg:flex">Finalizate</TabsTrigger>
          <TabsTrigger value={CampaignStatus.CANCELLED} className="hidden lg:flex">Anulate</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută campanii..."
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
                <SheetTitle>Filtrare campanii</SheetTitle>
                <SheetDescription>
                  Aplicați filtre pentru a găsi campaniile dorite.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value as CampaignStatus | "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toate</SelectItem>
                      <SelectItem value={CampaignStatus.DRAFT}>Ciornă</SelectItem>
                      <SelectItem value={CampaignStatus.SCHEDULED}>Programată</SelectItem>
                      <SelectItem value={CampaignStatus.ACTIVE}>Activă</SelectItem>
                      <SelectItem value={CampaignStatus.PAUSED}>Pausată</SelectItem>
                      <SelectItem value={CampaignStatus.COMPLETED}>Finalizată</SelectItem>
                      <SelectItem value={CampaignStatus.CANCELLED}>Anulată</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                
                {/* Add date range selector if needed */}
                
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline" onClick={resetFilters}>Resetează</Button>
                </SheetClose>
                <Button onClick={applyFilters}>Aplică filtre</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Export</span>
          </Button>
          
          <Button variant="outline" onClick={() => setCurrentPage(1)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Actualizează</span>
          </Button>
        </div>
      </div>
      
      {/* Campaigns Table */}
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>
            {total} {total === 1 ? 'campanie' : 'campanii'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Programată</TableHead>
                <TableHead className="hidden lg:table-cell">Ultimul update</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeletons
                Array(5).fill(0).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-9 w-[50px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : campaigns.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-muted-foreground">Nu există campanii care să corespundă filtrelor.</p>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/marketing/campaigns/new">Creați o campanie</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Campaign rows
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/marketing/campaigns/${campaign.id}`}>
                        <span className="font-medium hover:text-primary hover:underline cursor-pointer">
                          {campaign.name}
                        </span>
                      </Link>
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px] hidden md:block">
                          {campaign.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <TypeLabel type={campaign.type} />
                    </TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={campaign.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(campaign.scheduledAt)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(campaign.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Acțiuni</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuLabel>Acțiuni campanie</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/marketing/campaigns/${campaign.id}`}>
                              <FileText className="h-4 w-4 mr-2" />
                              Vizualizare
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/marketing/campaigns/edit/${campaign.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editare
                            </Link>
                          </DropdownMenuItem>
                          
                          {/* Conditional actions based on status */}
                          {campaign.status === CampaignStatus.DRAFT && (
                            <DropdownMenuItem onClick={() => handleStartCampaign(campaign.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Trimite acum
                            </DropdownMenuItem>
                          )}
                          
                          {campaign.status === CampaignStatus.ACTIVE && (
                            <DropdownMenuItem onClick={() => handlePauseCampaign(campaign.id)}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pausează
                            </DropdownMenuItem>
                          )}
                          
                          {campaign.status === CampaignStatus.PAUSED && (
                            <DropdownMenuItem onClick={() => handleResumeCampaign(campaign.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Reia
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplică
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Șterge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Pagination className="mx-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              let pageNumber: number;
              const middleIndex = 2;
              
              if (totalPages <= 5) {
                pageNumber = idx + 1;
              } else if (currentPage <= middleIndex) {
                pageNumber = idx + 1;
              } else if (currentPage >= totalPages - middleIndex + 1) {
                pageNumber = totalPages - 4 + idx;
              } else {
                pageNumber = currentPage - middleIndex + idx;
              }
              
              if (totalPages > 5 && pageNumber === 1 && idx === 0) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={currentPage === pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              
              if (totalPages > 5 && pageNumber === totalPages && idx === 4) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={currentPage === pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              
              if (totalPages > 5 && (idx === 1 && currentPage > 3) || (idx === 3 && currentPage < totalPages - 2)) {
                return (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <span className="flex h-9 w-9 items-center justify-center">...</span>
                  </PaginationItem>
                );
              }
              
              if (pageNumber > 0 && pageNumber <= totalPages) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={currentPage === pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationModal 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteCampaign}
        title="Confirmă ștergerea"
        description="Sunteți sigur că doriți să ștergeți această campanie? Această acțiune nu poate fi anulată."
        type="delete"
        isLoading={deleteCampaign.isPending}
      />
    </div>
  );
};

export default CampaignsPage;