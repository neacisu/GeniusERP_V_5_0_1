/**
 * Invoice Numbering Settings Component
 * 
 * Manages invoice series and numbering settings according to Romanian regulations.
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { InvoiceNumberingTable } from "./InvoiceNumberingTable";
import { InvoiceNumberingForm } from "./InvoiceNumberingForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInvoiceNumberingApi } from "../../hooks/useInvoiceNumberingApi";
import { useWarehouses } from "../../../inventory/hooks/useInventoryApi";
import { useFranchises } from "../../hooks/useFranchises";
import { InvoiceNumberingSetting } from "@shared/schema/invoice-numbering.schema";
import { z } from "zod";

export function InvoiceNumberingSettings() {
  const { useUpdateInvoiceNumberingSetting, useCreateInvoiceNumberingSetting } = useInvoiceNumberingApi();
  const updateInvoiceNumberingSetting = useUpdateInvoiceNumberingSetting();
  const createInvoiceNumberingSetting = useCreateInvoiceNumberingSetting();
  const { warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { franchises, isLoading: isLoadingFranchises } = useFranchises();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<InvoiceNumberingSetting | null>(null);

  const handleOpenDialog = () => {
    setEditingSetting(null);
    setDialogOpen(true);
  };

  const handleEdit = (setting: InvoiceNumberingSetting) => {
    setEditingSetting(setting);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSetting(null);
  };

  const handleSetDefault = (id: string) => {
    updateInvoiceNumberingSetting.mutate({
      id,
      data: {
        isDefault: true
      }
    });
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingSetting) {
      // Update existing setting
      updateInvoiceNumberingSetting.mutate({
        id: editingSetting.id,
        data: {
          description: values.description,
          nextNumber: values.nextNumber,
          prefix: values.prefix,
          suffix: values.suffix,
          year: values.year,
          warehouseId: values.warehouseId,
          franchiseId: values.franchiseId,
          isDefault: values.isDefault,
          isActive: values.isActive
        }
      });
    } else {
      // Create new setting
      createInvoiceNumberingSetting.mutate({
        companyId: "", // This will be filled on the server side from user session
        series: values.series,
        description: values.description,
        nextNumber: values.nextNumber,
        prefix: values.prefix,
        suffix: values.suffix,
        year: values.year,
        warehouseId: values.warehouseId,
        franchiseId: values.franchiseId,
        isDefault: values.isDefault,
        isActive: values.isActive
      });
    }
    
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Numerotare facturi</CardTitle>
            <CardDescription>
              Configurează seriile și numerotarea facturilor conform cerințelor ANAF
              {(isLoadingWarehouses || isLoadingFranchises) && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Se încarcă datele...
                </span>
              )}
            </CardDescription>
          </div>
          <Button 
            onClick={handleOpenDialog} 
            className="flex items-center gap-2" 
            disabled={isLoadingWarehouses || isLoadingFranchises}
          >
            <PlusCircle className="h-4 w-4" />
            Adaugă serie
          </Button>
        </CardHeader>
        <CardContent>
          <InvoiceNumberingTable
            onEdit={handleEdit}
            onSetDefault={handleSetDefault}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingSetting ? `Editare serie ${editingSetting.series}` : "Adaugă serie nouă"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Configurați seriile și numerotarea pentru facturi conform reglementărilor
            </p>
          </DialogHeader>
          <InvoiceNumberingForm
            setting={editingSetting || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            warehouses={warehouses ? warehouses : []}
            franchises={franchises || []}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form schema - defined here to avoid circular dependency
const formSchema = z.object({
  series: z
    .string()
    .min(1, "Seria este obligatorie")
    .max(10, "Seria poate avea maxim 10 caractere")
    .regex(/^[A-Za-z0-9]+$/, "Seria poate conține doar litere și cifre"),
  description: z.string().max(100, "Descrierea poate avea maxim 100 caractere").optional(),
  nextNumber: z.coerce
    .number()
    .int("Numărul trebuie să fie întreg")
    .min(1, "Numărul trebuie să fie cel puțin 1"),
  prefix: z.string().max(10, "Prefixul poate avea maxim 10 caractere").optional(),
  suffix: z.string().max(10, "Sufixul poate avea maxim 10 caractere").optional(),
  year: z.coerce
    .number()
    .int("Anul trebuie să fie întreg")
    .min(2000, "Anul trebuie să fie cel puțin 2000")
    .max(2100, "Anul trebuie să fie cel mult 2100")
    .optional(),
  warehouseId: z.string().uuid("ID depozit invalid").optional().nullable(),
  franchiseId: z.string().uuid("ID franciză invalid").optional().nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});