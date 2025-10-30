import React from "react";
import { UserTable } from "@/modules/admin/components/users/UserTable";
import { useUsers } from "@/modules/admin/hooks/useUsers";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus } from "lucide-react";

export default function UsersPage() {
  // Folosim hook-ul pentru a obține utilizatorii și a-i transmite la UserTable
  const { data, isLoading, error } = useUsers({});
  
  // Extragem datele pentru a le trimite la tabel
  const users = data?.data || [];
  
  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Administrare utilizatori</h2>
            <p className="text-sm text-muted-foreground">
              Gestionați utilizatorii și permisiunile lor.
            </p>
          </div>
          <div className="ml-auto flex space-x-2">
            <Button asChild>
              <Link href="/admin/users/new">
                <Plus className="mr-2 h-4 w-4" />
                Utilizator nou
              </Link>
            </Button>
          </div>
        </div>
        
        <UserTable users={users} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}