/**
 * Invoices List Page
 * 
 * Displays a list of invoices with search, filter, and sort capabilities.
 */

import React, { useState } from "react";
import { Link } from "wouter";
import { useInvoices } from "../../hooks/useInvoiceApi";
import { InvoiceStatus, InvoiceFilters } from "../../types";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Lucide icons
import {
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileDown,
  Printer,
  CircleCheck,
  CircleX,
  AlertTriangle,
  Loader2,
  Calendar,
  CreditCard
} from "lucide-react";

// Custom components
import PageHeader from "../../components/common/PageHeader";
import { StatusBadge } from "../../components/common/StatusBadge";
import TabsNav, { TabItem } from "../../components/common/TabsNav";
import { NewInvoiceDialog } from "../../components/dialogs/NewInvoiceDialog";

const InvoicesPage: React.FC = () => {
  // Filter and pagination state
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: "",
    page: 1,
    limit: 10,
    sortBy: "issueDate",
    sortDir: "desc"
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  
  // Fetch invoices
  const { 
    invoices, 
    total, 
    page, 
    limit, 
    isLoading, 
    deleteInvoice, 
    validateInvoice,
    cancelInvoice 
  } = useInvoices(filters);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, searchQuery });
  };
  
  // Handle status tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Map tab ID to invoice status
    let status = "";
    switch (tabId) {
      case "draft": status = InvoiceStatus.DRAFT; break;
      case "issued": status = InvoiceStatus.ISSUED; break;
      case "sent": status = InvoiceStatus.SENT; break;
      case "paid": status = InvoiceStatus.PAID; break;
      // "all" tab doesn't filter by status
    }
    
    setFilters({ ...filters, status, page: 1 });
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };
  
  // Handle sort change
  const handleSortChange = (field: string) => {
    const newSortDir = filters.sortBy === field && filters.sortDir === "asc" ? "desc" : "asc";
    setFilters({ ...filters, sortBy: field, sortDir: newSortDir });
  };
  
  // Handle invoice actions
  const handleValidateInvoice = (id: string) => {
    validateInvoice.mutate(id);
  };
  
  const handleCancelInvoice = (id: string) => {
    cancelInvoice.mutate(id);
  };
  
  const handleDeleteInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDeleteInvoice = () => {
    if (selectedInvoiceId) {
      deleteInvoice.mutate(selectedInvoiceId);
      setDeleteConfirmOpen(false);
      setSelectedInvoiceId(null);
    }
  };
  
  // Create a new invoice - using dialog
  const { toast } = useToast();
  
  // Refresh invoices list after a new invoice is created
  const handleInvoiceCreated = () => {
    toast({
      title: "Succes",
      description: "Factura a fost creată și adăugată la listă",
      variant: "default",
    });
  };
  
  // Tab items definition
  const tabItems: TabItem[] = [
    { id: "all", label: "Toate", count: total },
    { id: "draft", label: "Ciorne" },
    { id: "pending", label: "În așteptare" },
    { id: "validated", label: "Validate" },
    { id: "paid", label: "Plătite" },
    { id: "overdue", label: "Restante" }
  ];
  
  // Total pages for pagination
  const totalPages = Math.ceil(total / limit);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Facturi</h2>
          <p className="text-muted-foreground">
            Gestionarea facturilor emise către clienți
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center">
              <Printer className="mr-2 h-4 w-4" />
              Tiparire
            </Button>
            <Button variant="outline" className="flex items-center">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          <NewInvoiceDialog 
            onSuccess={handleInvoiceCreated} 
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Factură nouă
              </Button>
            }
          />
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <form onSubmit={handleSearch} className="flex-grow relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Caută după număr factură, client sau sumă..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            <div className="flex flex-shrink-0 space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center whitespace-nowrap" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtre Avansate
              </Button>
            </div>
          </div>
          
          {showAdvancedFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="date-from" className="block text-sm font-medium mb-1">
                  Data de la
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="date-from"
                    type="date"
                    className="pl-8"
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="date-to" className="block text-sm font-medium mb-1">
                  Data până la
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="date-to"
                    type="date"
                    className="pl-8"
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="payment-method" className="block text-sm font-medium mb-1">
                  Metodă de plată
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Select
                    onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}
                  >
                    <SelectTrigger id="payment-method" className="pl-8">
                      <SelectValue placeholder="Toate metodele" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toate metodele</SelectItem>
                      <SelectItem value="cash">Numerar</SelectItem>
                      <SelectItem value="bank_transfer">Transfer bancar</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="check">CEC / BO</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Invoices list */}
      <Card>
        <CardHeader className="pb-3">
          <TabsNav 
            tabs={tabItems} 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            className="mt-2"
          />
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSortChange("invoiceNumber")}
                    >
                      Nr. Factură
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSortChange("customerId")}
                    >
                      Client
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSortChange("issueDate")}
                    >
                      Data
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSortChange("dueDate")}
                    >
                      Scadență
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSortChange("grossTotal")}
                    >
                      Valoare
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nu există facturi care să corespundă criteriilor.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link href={`/invoicing/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
                          {invoice.series} - {invoice.number}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.customerName || invoice.customer_name || "Client necunoscut"}</TableCell>
                      <TableCell>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("ro-RO") : invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString("ro-RO") : "N/A"}</TableCell>
                      <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("ro-RO") : invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("ro-RO") : "N/A"}</TableCell>
                      <TableCell>
                        {(invoice.grossTotal ? invoice.grossTotal : invoice.gross_total ? invoice.gross_total : invoice.total_amount ? invoice.total_amount : 0).toLocaleString("ro-RO")} {invoice.currency || "RON"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Deschide meniu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/invoicing/invoices/${invoice.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>Vizualizare</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            {invoice.status === InvoiceStatus.DRAFT && (
                              <DropdownMenuItem asChild>
                                <Link href={`/invoicing/invoices/edit/${invoice.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Editare</span>
                                </Link>
                              </DropdownMenuItem>
                            )}
                            
                            {invoice.status === InvoiceStatus.DRAFT && (
                              <DropdownMenuItem 
                                onClick={() => handleValidateInvoice(invoice.id)}
                                disabled={validateInvoice.isPending}
                              >
                                <CircleCheck className="mr-2 h-4 w-4" />
                                <span>Validare</span>
                              </DropdownMenuItem>
                            )}
                            
                            {invoice.status === InvoiceStatus.ISSUED && (
                              <DropdownMenuItem 
                                onClick={() => handleCancelInvoice(invoice.id)}
                                disabled={cancelInvoice.isPending}
                              >
                                <CircleX className="mr-2 h-4 w-4" />
                                <span>Anulare</span>
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem asChild>
                              <a href={`/api/invoices/${invoice.id}/export`} target="_blank" rel="noopener noreferrer" download>
                                <FileDown className="mr-2 h-4 w-4" />
                                <span>Export PDF</span>
                              </a>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem>
                              <Printer className="mr-2 h-4 w-4" />
                              <span>Printare</span>
                            </DropdownMenuItem>
                            
                            {invoice.status === InvoiceStatus.DRAFT && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Ștergere</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(page - 1)}
                      className={page === 1 || isLoading ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={page === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => handlePageChange(totalPages)}
                          isActive={page === totalPages}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(page + 1)}
                      className={page === totalPages || isLoading ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmare ștergere</DialogTitle>
            <DialogDescription>
              Sunteți sigur că doriți să ștergeți această factură? Această acțiune nu poate fi anulată.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Anulare
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteInvoice}
              disabled={deleteInvoice.isPending}
            >
              {deleteInvoice.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se șterge...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Ștergere
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;