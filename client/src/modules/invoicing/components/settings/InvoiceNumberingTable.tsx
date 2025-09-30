/**
 * Invoice Numbering Table Component
 * 
 * Displays a table of invoice numbering settings with options to edit, delete
 * and set as default.
 */

import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  MoreVertical, 
  Star, 
  Check 
} from "lucide-react";
import { 
  useInvoiceNumberingApi 
} from "../../hooks/useInvoiceNumberingApi";
import { InvoiceNumberingSetting } from "@shared/schema/invoice-numbering.schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface InvoiceNumberingTableProps {
  onEdit: (setting: InvoiceNumberingSetting) => void;
  onSetDefault: (id: string) => void;
}

export function InvoiceNumberingTable({ onEdit, onSetDefault }: InvoiceNumberingTableProps) {
  const { useInvoiceNumberingSettings, useDeleteInvoiceNumberingSetting } = useInvoiceNumberingApi();
  const { data: settingsData, isLoading } = useInvoiceNumberingSettings();
  const settings = settingsData?.data || [];
  
  const deleteInvoiceNumberingSetting = useDeleteInvoiceNumberingSetting();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setSettingToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (settingToDelete) {
      deleteInvoiceNumberingSetting.mutate(settingToDelete);
    }
    setDeleteDialogOpen(false);
    setSettingToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 animate-pulse rounded-md w-full"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-md w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serie</TableHead>
            <TableHead>Descriere</TableHead>
            <TableHead>Număr curent</TableHead>
            <TableHead>Următorul număr</TableHead>
            <TableHead>Prefix</TableHead>
            <TableHead>Sufix</TableHead>
            <TableHead>An</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                Nu există setări de numerotare. Adăugați una nouă.
              </TableCell>
            </TableRow>
          ) : (
            settings.map((setting) => (
              <TableRow key={setting.id}>
                <TableCell className="font-medium">
                  {setting.isDefault && (
                    <Badge variant="secondary" className="mr-2">
                      <Star className="h-3 w-3 mr-1" />
                      Implicit
                    </Badge>
                  )}
                  {setting.series}
                </TableCell>
                <TableCell>{setting.description || '-'}</TableCell>
                <TableCell>{setting.lastNumber}</TableCell>
                <TableCell className="font-semibold">{setting.nextNumber}</TableCell>
                <TableCell>{setting.prefix || '-'}</TableCell>
                <TableCell>{setting.suffix || '-'}</TableCell>
                <TableCell>{setting.year || '-'}</TableCell>
                <TableCell>
                  {setting.isActive ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Activ
                    </Badge>
                  ) : (
                    <Badge variant="outline">Inactiv</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Deschide meniu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(setting)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editează
                      </DropdownMenuItem>
                      {!setting.isDefault && (
                        <DropdownMenuItem onClick={() => onSetDefault(setting.id)}>
                          <Star className="mr-2 h-4 w-4" />
                          Setează ca implicit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(setting.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Șterge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmați ștergerea</AlertDialogTitle>
            <AlertDialogDescription>
              Sigur doriți să ștergeți această serie de facturi? 
              Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}