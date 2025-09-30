import React, { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useRole, useUpdateRole, RoleFormData } from "../hooks/useRoles";
import { usePermissions } from "../hooks/usePermissions";
import { RoleForm } from "../components/roles/RoleForm";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function EditRolePage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  
  const { 
    data: roleData, 
    isLoading: isLoadingRole, 
    error: roleError 
  } = useRole(id);
  
  const { 
    data: permissionsData, 
    isLoading: isLoadingPermissions 
  } = usePermissions();
  
  const updateRoleMutation = useUpdateRole();

  // Show error if role not found
  useEffect(() => {
    if (roleError) {
      toast({
        title: "Eroare",
        description: "Rolul nu a fost găsit sau nu aveți permisiunea de a-l edita.",
        variant: "destructive",
      });
      setLocation("/admin/roles");
    }
  }, [roleError, toast, setLocation]);

  // Redirect after successful update
  useEffect(() => {
    if (updateRoleMutation.isSuccess) {
      toast({
        title: "Succes",
        description: "Rolul a fost actualizat cu succes.",
      });
      setLocation("/admin/roles");
    }
  }, [updateRoleMutation.isSuccess, toast, setLocation]);

  const handleSubmit = (formData: RoleFormData) => {
    if (!id) return;
    
    updateRoleMutation.mutate({ 
      id, 
      role: formData 
    });
  };

  const isLoading = isLoadingRole || isLoadingPermissions;

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
              <h1 className="text-2xl font-semibold text-gray-900">Editare rol</h1>
            </div>
            <p className="text-gray-500">
              Actualizați rolul și permisiunile asociate
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <RoleForm
            role={roleData?.data}
            permissions={permissionsData?.data || []}
            onSubmit={handleSubmit}
            isPending={updateRoleMutation.isPending}
          />
        )}
      </div>
    </AppLayout>
  );
}