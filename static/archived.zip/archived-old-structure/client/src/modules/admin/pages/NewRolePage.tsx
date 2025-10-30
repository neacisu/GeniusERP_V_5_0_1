import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateRole } from "../hooks/useRoles";
import { usePermissions } from "../hooks/usePermissions";
import { RoleForm } from "../components/roles/RoleForm";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function NewRolePage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();
  const createRoleMutation = useCreateRole();

  // Redirect after successful creation
  useEffect(() => {
    if (createRoleMutation.isSuccess) {
      toast({
        title: "Succes",
        description: "Rolul a fost creat cu succes.",
      });
      setLocation("/admin/roles");
    }
  }, [createRoleMutation.isSuccess, toast, setLocation]);

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/roles">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-semibold text-gray-900">Adaugă rol</h1>
            </div>
            <p className="text-gray-500">
              Creați un nou rol și configurați permisiunile
            </p>
          </div>
        </div>

        {isLoadingPermissions ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <RoleForm
            permissions={permissionsData?.data || []}
            onSubmit={createRoleMutation.mutate}
            isPending={createRoleMutation.isPending}
          />
        )}
      </div>
    </AppLayout>
  );
}