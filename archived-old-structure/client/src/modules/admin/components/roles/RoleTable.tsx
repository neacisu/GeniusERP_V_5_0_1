import React, { useState } from "react";
import { Link } from "wouter";
import { useDeleteRole } from "../../hooks/useRoles";
import { Role } from "../../hooks/useUsers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, ShieldAlert, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

interface RoleTableProps {
  roles: Role[];
  isLoading: boolean;
}

export function RoleTable({ roles, isLoading }: RoleTableProps) {
  const { toast } = useToast();
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const deleteRoleMutation = useDeleteRole();
  
  const selectedRole = deleteRoleId 
    ? roles.find(role => role.id === deleteRoleId) 
    : null;

  const handleDelete = async () => {
    if (!deleteRoleId) return;
    
    try {
      await deleteRoleMutation.mutateAsync(deleteRoleId);
      toast({
        title: "Rol șters",
        description: "Rolul a fost șters cu succes.",
      });
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge rolul.",
        variant: "destructive",
      });
    } finally {
      setDeleteRoleId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nume</TableHead>
              <TableHead>Descriere</TableHead>
              <TableHead>Permisiuni</TableHead>
              <TableHead>Înregistrat</TableHead>
              <TableHead className="text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center"
                >
                  Nu s-au găsit roluri
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => {
                // Determinăm dacă este un rol de sistem după nume (nu după isSystem, care nu există în DB)
                const isSystemRole = role.name === 'admin' || role.name === 'user';
                
                return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isSystemRole && (
                          <ShieldAlert className="h-4 w-4 text-amber-500" />
                        )}
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell>{role.description || "-"}</TableCell>
                    <TableCell>
                      {/* Permisiunile sunt gestionate separat, nu direct pe rol */}
                      <span className="text-muted-foreground">Permisiuni gestionate separat</span>
                    </TableCell>
                    <TableCell>
                      {role.createdAt ? (
                        <span className="text-sm text-muted-foreground" title={new Date(role.createdAt).toLocaleString("ro-RO")}>
                          {formatDistanceToNow(new Date(role.createdAt), { 
                            addSuffix: true,
                            locale: ro
                          })}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/roles/${role.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editează</span>
                          </Link>
                        </Button>
                        {!isSystemRole && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteRoleId(role.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Șterge</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteRoleId}
        onOpenChange={(open) => !open && setDeleteRoleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune va șterge definitiv rolul "{selectedRole?.name}" și nu poate fi anulată.
              Utilizatorii care au acest rol vor rămâne fără acesta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}