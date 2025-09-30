/**
 * Inventory Assessments List Page
 * 
 * Displays all inventory assessments (Inventariere) for the company
 * according to Romanian accounting standards OMFP 2861/2009 and Law 82/1991.
 */

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

// API Hooks
import { useInventoryApi } from "../../hooks/useInventoryApi";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2 as Spinner } from "lucide-react";

// Icons
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileCheck,
  FileDown,
  FilePlus,
  FileText,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

// Common components
import PageHeader from "../../components/common/PageHeader";

// Translation mappings for Romanian UI
const assessmentTypeLabels = {
  annual: "Anuală",
  monthly: "Lunară",
  unscheduled: "Neplanificată",
  special: "Specială",
};

const statusLabels = {
  draft: "Ciornă",
  in_progress: "În progres",
  pending_approval: "În așteptare",
  approved: "Aprobat",
  finalized: "Finalizat",
  cancelled: "Anulat",
};

const statusColors = {
  draft: "secondary",
  in_progress: "warning",
  pending_approval: "warning",
  approved: "success",
  finalized: "success",
  cancelled: "destructive",
};

// Main component
const InventoryAssessmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  
  // API hooks
  const { assessments, isLoadingAssessments, assessmentSummary } = useInventoryApi();
  
  // Filter assessments based on active tab
  const filteredAssessments = assessments.filter((assessment) => {
    if (activeTab === "all") return true;
    return assessment.status === activeTab;
  });
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventarieri"
        description="Gestionați inventarierile conform legislației Românești"
      />
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inventarieri totale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessmentSummary?.totalCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Toate documentele de inventariere
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">În progres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessmentSummary?.inProgressCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventarieri în curs
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Finalizate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessmentSummary?.finalizedCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventarieri finalizate
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aprobate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessmentSummary?.approvedCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventarieri aprobate
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Lista inventarierilor</CardTitle>
              <CardDescription>
                Inventarieri conform OMFP 2861/2009 și Legii contabilității 82/1991
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/inventory/assessments/new">
                <FilePlus className="w-4 h-4 mr-2" />
                Creare inventariere
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Toate</TabsTrigger>
              <TabsTrigger value="draft">Ciorne</TabsTrigger>
              <TabsTrigger value="in_progress">În progres</TabsTrigger>
              <TabsTrigger value="pending_approval">În așteptare</TabsTrigger>
              <TabsTrigger value="approved">Aprobate</TabsTrigger>
              <TabsTrigger value="finalized">Finalizate</TabsTrigger>
            </TabsList>
            
            <div className="rounded-md border">
              <Table>
                <TableCaption>Lista documentelor de inventariere</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Document</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Gestiune</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAssessments ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex justify-center items-center h-full">
                          <Spinner />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredAssessments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Nu există inventarieri în această categorie
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/inventory/assessments/new">
                              <FilePlus className="w-4 h-4 mr-2" />
                              Creare inventariere
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">
                          {assessment.assessment_number || assessment.documentNumber || "N/A"}
                        </TableCell>
                        <TableCell>
                          {assessment.start_date 
                            ? format(new Date(assessment.start_date), "dd MMM yyyy", { locale: ro })
                            : assessment.startDate 
                              ? format(new Date(assessment.startDate), "dd MMM yyyy", { locale: ro })
                              : "N/A"}
                        </TableCell>
                        <TableCell>
                          {assessment.warehouse?.name || "Necunoscut"}
                        </TableCell>
                        <TableCell>
                          {assessmentTypeLabels[assessment.assessment_type || assessment.type] || assessment.assessment_type || assessment.type || "Necunoscut"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              statusColors[assessment.status || assessment.status] as any || "secondary"
                            }
                          >
                            {assessment.status 
                              ? statusLabels[assessment.status] || assessment.status 
                              : statusLabels[assessment.status] || assessment.status || "Necunoscut"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acțiuni</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/inventory/assessments/${assessment.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Vizualizare
                                </Link>
                              </DropdownMenuItem>
                              {(assessment.status === "draft" || assessment.status === "in_progress") && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/inventory/assessments/edit/${assessment.id}`}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editare
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/inventory/assessments/${assessment.id}/export`}>
                                  <FileDown className="w-4 h-4 mr-2" />
                                  Export rapoarte
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Legal information card */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
            Informație legislativă
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Conform legislației românești (OMFP 2861/2009 și Legea contabilității 82/1991), societățile sunt obligate să efectueze inventarierea cel puțin o dată pe an. Documentele generate în acest proces trebuie păstrate conform reglementărilor pentru minimum 10 ani.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAssessmentsPage;