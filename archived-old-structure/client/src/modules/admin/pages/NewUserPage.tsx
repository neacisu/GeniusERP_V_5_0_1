import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useRoles } from "../hooks/useRoles";
import { useCreateUser } from "../hooks/useUsers";
import { UserForm } from "../components/users/UserForm";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewUserPage() {
  const [_, setLocation] = useLocation();
  const { data: rolesData, isLoading: isLoadingRoles } = useRoles({
    limit: 100, // Get all roles
  });
  
  const createUserMutation = useCreateUser();

  // Redirect after successful creation
  useEffect(() => {
    if (createUserMutation.isSuccess) {
      setLocation("/admin/users");
    }
  }, [createUserMutation.isSuccess, setLocation]);

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
              <h1 className="text-2xl font-semibold text-gray-900">Adaugă utilizator</h1>
            </div>
            <p className="text-gray-500">
              Creați un nou utilizator și atribuiți roluri
            </p>
          </div>
        </div>

        {isLoadingRoles ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <UserForm
            roles={rolesData?.data || []}
            onSubmit={createUserMutation.mutate}
            isPending={createUserMutation.isPending}
          />
        )}
      </div>
    </AppLayout>
  );
}