import React, { useState } from "react";
import { usePermissions } from "../hooks/usePermissions";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function PermissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  
  const { data, isLoading, refetch } = usePermissions();
  
  // Group permissions by module
  const moduleGroups = data?.data.reduce((acc: Record<string, any[]>, permission: any) => {
    const module = permission.module || "Altele";
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, any[]>) || {};
  
  // Get sorted module names
  const modules = Object.keys(moduleGroups).sort();
  
  // Set initial active tab if not set
  if (modules.length > 0 && !activeTab) {
    setActiveTab(modules[0]);
  }
  
  // Filter permissions based on search query
  const filteredPermissions = data?.data.filter((permission: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      permission.name.toLowerCase().includes(query) ||
      (permission.description && permission.description.toLowerCase().includes(query)) ||
      (permission.module && permission.module.toLowerCase().includes(query))
    );
  }) || [];
  
  // Group filtered permissions by module
  const filteredModuleGroups = filteredPermissions.reduce((acc: Record<string, any[]>, permission: any) => {
    const module = permission.module || "Altele";
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, any[]>);
  
  return (
    <AppLayout>
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Permisiuni</h1>
          <p className="text-gray-500">
            Vizualizați toate permisiunile disponibile în sistem
          </p>
        </div>

        <Card>
          <CardHeader className="px-5 pt-6 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permisiuni</CardTitle>
                <CardDescription>
                  Permisiunile disponibile pentru atribuire rolurilor
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="w-full sm:max-w-xs">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Caută permisiuni..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : searchQuery ? (
                <PermissionsTable permissions={filteredPermissions} />
              ) : (
                <Tabs value={activeTab || undefined} onValueChange={setActiveTab}>
                  <TabsList className="w-full flex-wrap">
                    {modules.map((module) => (
                      <TabsTrigger key={module} value={module} className="flex-grow">
                        {module}
                        <Badge className="ml-2" variant="secondary">
                          {moduleGroups[module].length}
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {modules.map((module) => (
                    <TabsContent key={module} value={module} className="pt-4">
                      <PermissionsTable permissions={moduleGroups[module]} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function PermissionsTable({ permissions }: { permissions: any[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permisiune</TableHead>
            <TableHead>Descriere</TableHead>
            <TableHead>Modul</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                Nu există permisiuni
              </TableCell>
            </TableRow>
          ) : (
            permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell className="font-medium">
                  {permission.name}
                </TableCell>
                <TableCell>
                  {permission.description || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {permission.module || "Altele"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}