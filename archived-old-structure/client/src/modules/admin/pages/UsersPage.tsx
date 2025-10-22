import React, { useState } from "react";
import { Link } from "wouter";
import { useUsers, UserParams } from "../hooks/useUsers";
import { UserTable } from "../components/users/UserTable";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { UserPlus, Search, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UsersPage() {
  const [queryParams, setQueryParams] = useState<UserParams>({
    page: 1,
    limit: 10,
    status: "",
  });
  
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch } = useUsers(queryParams);

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleLimitChange = (limit: string) => {
    setQueryParams((prev) => ({
      ...prev,
      page: 1, // Reset to first page when changing limit
      limit: parseInt(limit),
    }));
  };

  const handleStatusChange = (status: string) => {
    setQueryParams((prev) => ({
      ...prev,
      page: 1, // Reset to first page when changing status
      status,
    }));
  };

  const renderPagination = () => {
    if (!data || !data.pagination || data.pagination.totalPages <= 1) return null;
    
    const { page, totalPages } = data.pagination;
    
    // Calculate range of pages to show
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    
    // Adjust if we're at the edges
    if (endPage - startPage < 4 && totalPages > 5) {
      if (startPage === 1) {
        endPage = Math.min(5, totalPages);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - 4);
      }
    }
    
    const pages = [];
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        pages.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    // Add pages in range
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={page === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            {page === 1 ? (
              <PaginationPrevious aria-disabled="true" className="pointer-events-none opacity-50" />
            ) : (
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(1, page - 1))}
              />
            )}
          </PaginationItem>
          {pages}
          <PaginationItem>
            {page === totalPages ? (
              <PaginationNext aria-disabled="true" className="pointer-events-none opacity-50" />
            ) : (
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              />
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Gestionare Utilizatori</h1>
          <p className="text-gray-500">
            Administrați utilizatorii sistemului și atribuiți roluri acestora.
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" onClick={() => handleStatusChange("")}>Toți utilizatorii</TabsTrigger>
            <TabsTrigger value="active" onClick={() => handleStatusChange("active")}>Activi</TabsTrigger>
            <TabsTrigger value="inactive" onClick={() => handleStatusChange("inactive")}>Inactivi</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="px-5 pt-6 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Utilizatori</CardTitle>
                    <CardDescription>
                      Toți utilizatorii sistemului
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => refetch()}
                      title="Reîmprospătează"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button asChild>
                      <Link href="/admin/users/new">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adaugă utilizator
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-between">
                    <div className="flex space-x-2">
                      <div className="w-[280px]">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Caută utilizatori..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            // Implement search functionality
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Afișează</span>
                      <Select
                        value={String(queryParams.limit)}
                        onValueChange={handleLimitChange}
                      >
                        <SelectTrigger className="w-[70px]">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-500">utilizatori</span>
                    </div>
                  </div>

                  <UserTable
                    users={data?.data || []}
                    isLoading={isLoading}
                  />

                  {renderPagination()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader className="px-5 pt-6 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Utilizatori activi</CardTitle>
                    <CardDescription>
                      Utilizatorii care au acces activ în sistem
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => refetch()}
                      title="Reîmprospătează"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button asChild>
                      <Link href="/admin/users/new">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adaugă utilizator
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-between">
                    <div className="flex space-x-2">
                      <div className="w-[280px]">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Caută utilizatori..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            // Implement search functionality
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Afișează</span>
                      <Select
                        value={String(queryParams.limit)}
                        onValueChange={handleLimitChange}
                      >
                        <SelectTrigger className="w-[70px]">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-500">utilizatori</span>
                    </div>
                  </div>

                  <UserTable
                    users={data?.data || []}
                    isLoading={isLoading}
                  />

                  {renderPagination()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4">
            <Card>
              <CardHeader className="px-5 pt-6 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Utilizatori inactivi</CardTitle>
                    <CardDescription>
                      Utilizatori dezactivați sau suspendați
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => refetch()}
                      title="Reîmprospătează"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button asChild>
                      <Link href="/admin/users/new">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adaugă utilizator
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-between">
                    <div className="flex space-x-2">
                      <div className="w-[280px]">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Caută utilizatori..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            // Implement search functionality
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Afișează</span>
                      <Select
                        value={String(queryParams.limit)}
                        onValueChange={handleLimitChange}
                      >
                        <SelectTrigger className="w-[70px]">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-500">utilizatori</span>
                    </div>
                  </div>

                  <UserTable
                    users={data?.data || []}
                    isLoading={isLoading}
                  />

                  {renderPagination()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}