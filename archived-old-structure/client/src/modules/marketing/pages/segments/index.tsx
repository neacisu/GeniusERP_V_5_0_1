/**
 * Segments Page
 * 
 * Displays a list of audience segments for targeting marketing campaigns.
 */

import React, { useState } from "react";
import { Link } from "wouter";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  RefreshCw,
  Edit,
  Trash,
  Copy,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useSegments } from "../../hooks/useMarketingApi";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Format date function
const formatDate = (date: string | Date | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ro-RO');
};

const SegmentsPage: React.FC = () => {
  const { toast } = useToast();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null);
  
  // Fetch segments with filters
  const { 
    segments, 
    total, 
    page, 
    pageSize, 
    totalPages,
    isLoading, 
    deleteSegment,
    updateSegment
  } = useSegments({
    isActive,
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
    setIsActive(undefined);
    setCurrentPage(1);
  };
  
  // Handle segment deletion
  const handleDeleteSegment = (id: string) => {
    setSegmentToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteSegment = async () => {
    if (segmentToDelete) {
      await deleteSegment.mutateAsync(segmentToDelete);
      setIsDeleteDialogOpen(false);
      setSegmentToDelete(null);
    }
  };
  
  // Handle status toggle
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateSegment.mutateAsync({
        id,
        data: { isActive: !currentStatus }
      });
      toast({
        title: "Status actualizat",
        description: `Segmentul a fost ${!currentStatus ? 'activat' : 'dezactivat'} cu succes.`,
      });
    } catch (error) {
      console.error("Error toggling segment status:", error);
    }
  };
  
  // Handle segment duplication
  const handleDuplicateSegment = (id: string) => {
    toast({
      title: "Acțiune în dezvoltare",
      description: "Funcționalitatea de duplicare a segmentului va fi disponibilă în curând.",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Segmente Audiență</h1>
        <Button asChild>
          <Link href="/marketing/segments/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Segment nou
          </Link>
        </Button>
      </div>
      
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută segmente..."
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
                <SheetTitle>Filtrare segmente</SheetTitle>
                <SheetDescription>
                  Aplicați filtre pentru a găsi segmentele dorite.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-4">
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
                    <Label>Doar segmente active</Label>
                  </div>
                </div>
                {/* More filters can be added here */}
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
      
      {/* Segments Table */}
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>
            {total} {total === 1 ? 'segment' : 'segmente'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Potențial audiență</TableHead>
                <TableHead className="hidden lg:table-cell">Ultima actualizare</TableHead>
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
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-9 w-[50px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : segments.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-muted-foreground">Nu există segmente care să corespundă filtrelor.</p>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/marketing/segments/new">Creați un segment</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Segment rows
                segments.map((segment) => (
                  <TableRow key={segment.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/marketing/segments/${segment.id}`}>
                        <span className="font-medium hover:text-primary hover:underline cursor-pointer">
                          {segment.name}
                        </span>
                      </Link>
                      {segment.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px] hidden md:block">
                          {segment.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={segment.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {segment.isActive ? 'Activ' : 'Inactiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {segment.estimatedReach ? segment.estimatedReach.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(segment.lastRefreshedAt || segment.updatedAt)}
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
                          <DropdownMenuLabel>Acțiuni segment</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/marketing/segments/${segment.id}`}>
                              <FileText className="h-4 w-4 mr-2" />
                              Vizualizare
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/marketing/segments/edit/${segment.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editare
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleToggleStatus(segment.id, !!segment.isActive)}>
                            {segment.isActive ? (
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
                            <Link href={`/marketing/campaigns/new?segmentId=${segment.id}`}>
                              <Users className="h-4 w-4 mr-2" />
                              Creează campanie
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleDuplicateSegment(segment.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplică
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSegment(segment.id)}
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
              
              if (totalPages > 5 && idx === 1 && currentPage > 3) {
                return (
                  <PaginationItem key={`ellipsis-start`}>
                    <span className="flex h-9 w-9 items-center justify-center">...</span>
                  </PaginationItem>
                );
              }
              
              if (totalPages > 5 && idx === 3 && currentPage < totalPages - 2) {
                return (
                  <PaginationItem key={`ellipsis-end`}>
                    <span className="flex h-9 w-9 items-center justify-center">...</span>
                  </PaginationItem>
                );
              }
              
              if (pageNumber > 0 && pageNumber <= totalPages && 
                  !((totalPages > 5 && pageNumber > 2 && pageNumber < totalPages - 1) && 
                    (pageNumber < currentPage - 1 || pageNumber > currentPage + 1))) {
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmă ștergerea</DialogTitle>
            <DialogDescription>
              Sunteți sigur că doriți să ștergeți acest segment? Această acțiune nu poate fi anulată și poate afecta campaniile care folosesc acest segment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSegment}>
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SegmentsPage;