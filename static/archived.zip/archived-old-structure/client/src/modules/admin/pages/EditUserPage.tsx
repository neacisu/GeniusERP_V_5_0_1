import React, { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useRoles } from "@/modules/admin/hooks/useRoles";
import { useUser, useUpdateUser, UserFormData } from "@/modules/admin/hooks/useUsers";
import { UserForm } from "@/modules/admin/components/users/UserForm";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function EditUserPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  
  // Adăugăm logging pentru a verifica ID-ul
  console.log("EditUserPage (in modules/admin/pages) rendered with ID:", id);
  
  const { 
    data: userData, 
    isLoading: isLoadingUser, 
    error: userError 
  } = useUser(id || "");
  
  const { 
    data: rolesData, 
    isLoading: isLoadingRoles 
  } = useRoles({
    limit: 100, // Get all roles
  });
  
  const updateUserMutation = useUpdateUser();

  // Show error if user not found
  useEffect(() => {
    if (userError) {
      toast({
        title: "Eroare",
        description: "Utilizatorul nu a fost găsit sau nu aveți permisiunea de a-l edita.",
        variant: "destructive",
      });
      setLocation("/admin/users");
    }
  }, [userError, toast, setLocation]);

  // Redirect after successful update
  useEffect(() => {
    if (updateUserMutation.isSuccess) {
      toast({
        title: "Succes",
        description: "Utilizatorul a fost actualizat cu succes.",
      });
      setLocation("/admin/users");
    }
  }, [updateUserMutation.isSuccess, toast, setLocation]);

  const handleSubmit = (formData: UserFormData) => {
    if (!id) return;
    
    updateUserMutation.mutate({ 
      id, 
      user: formData 
    });
  };

  const isLoading = isLoadingUser || isLoadingRoles;

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/users">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-semibold text-gray-900">Editare utilizator</h1>
            </div>
            <p className="text-gray-500">
              Actualizați datele și permisiunile utilizatorului
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <UserForm
            user={userData?.data}
            roles={rolesData?.data || []}
            onSubmit={handleSubmit}
            isPending={updateUserMutation.isPending}
          />
        )}
      </div>
    </AppLayout>
  );
}