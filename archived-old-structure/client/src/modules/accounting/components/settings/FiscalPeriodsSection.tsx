/**
 * Fiscal Periods Section
 * 
 * Component for managing fiscal periods
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SettingCard from "@/modules/settings/components/cards/SettingCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Lock, Unlock } from "lucide-react";

interface FiscalPeriod {
  id: string;
  year: number;
  month: number;
  status: "open" | "soft_close" | "hard_close";
  closedAt?: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
}

interface FiscalPeriodsSectionProps {
  companyId: string;
}

const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
];

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Deschis", variant: "default" },
  soft_close: { label: "Închis Soft", variant: "secondary" },
  hard_close: { label: "Închis Hard", variant: "destructive" },
};

export default function FiscalPeriodsSection({ companyId }: FiscalPeriodsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<FiscalPeriod | null>(null);
  const [action, setAction] = useState<"close" | "reopen" | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch fiscal periods
  const { data: periods = [], isLoading } = useQuery<FiscalPeriod[]>({
    queryKey: [`/api/accounting/settings/${companyId}/fiscal-periods`],
  });

  const handleClose = (period: FiscalPeriod) => {
    setSelectedPeriod(period);
    setAction("close");
    setReason("");
    setShowDialog(true);
  };

  const handleReopen = (period: FiscalPeriod) => {
    setSelectedPeriod(period);
    setAction("reopen");
    setReason("");
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!selectedPeriod || !action) return;

    if (action === "reopen" && !reason.trim()) {
      toast({
        title: "Eroare",
        description: "Motivul redeschiderii este obligatoriu",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = action === "close"
        ? `/api/accounting/fiscal-periods/${selectedPeriod.id}/close`
        : `/api/accounting/fiscal-periods/${selectedPeriod.id}/reopen`;

      await apiRequest(endpoint, {
        method: 'POST',
        body: { reason: reason.trim() || undefined },
      });

      await queryClient.invalidateQueries({ 
        queryKey: [`/api/accounting/settings/${companyId}/fiscal-periods`] 
      });

      toast({
        title: "Succes",
        description: action === "close" 
          ? "Perioada fiscală a fost închisă" 
          : "Perioada fiscală a fost redeschisă",
      });

      setShowDialog(false);
      setSelectedPeriod(null);
      setAction(null);
      setReason("");
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <SettingCard
        title="Perioade Fiscale"
        description="Gestionați perioadele fiscale și statusul acestora"
        headerAction={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Perioadă
          </Button>
        }
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perioadă</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Închis de</TableHead>
                <TableHead>Data închidere</TableHead>
                <TableHead>Motiv redeschidere</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nu există perioade fiscale configurate
                  </TableCell>
                </TableRow>
              ) : (
                periods.map((period: FiscalPeriod) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">
                      {MONTH_NAMES[period.month - 1]} {period.year}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_LABELS[period.status]?.variant || "outline"}>
                        {STATUS_LABELS[period.status]?.label || period.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {period.closedBy || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {period.closedAt 
                        ? new Date(period.closedAt).toLocaleDateString("ro-RO")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {period.reopenReason || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {period.status === "open" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleClose(period)}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Închide
                          </Button>
                        )}
                        {period.status !== "open" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReopen(period)}
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            Redeschide
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900">Atenție!</h4>
              <ul className="mt-2 text-sm text-amber-800 space-y-1">
                <li>• <strong>Soft Close:</strong> Permite vizualizare dar nu permite modificări</li>
                <li>• <strong>Hard Close:</strong> Blochează complet perioada (recomandat după audit)</li>
                <li>• Redeschiderea necesită motivare pentru audit trail</li>
              </ul>
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Dialog for Close/Reopen */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "close" ? "Închide Perioadă Fiscală" : "Redeschide Perioadă Fiscală"}
            </DialogTitle>
            <DialogDescription>
              {selectedPeriod && (
                <>
                  {action === "close" 
                    ? `Sunteți sigur că doriți să închideți perioada ${MONTH_NAMES[selectedPeriod.month - 1]} ${selectedPeriod.year}?`
                    : `Redeschiderea perioadei ${MONTH_NAMES[selectedPeriod.month - 1]} ${selectedPeriod.year} necesită un motiv.`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {action === "reopen" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Motiv redeschidere *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Introduceți motivul redeschiderii..."
                rows={4}
              />
            </div>
          )}

          {action === "close" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Motiv închidere (opțional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Introduceți motivul închiderii..."
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSubmitting}
            >
              Anulează
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (action === "reopen" && !reason.trim())}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {action === "close" ? "Închide" : "Redeschide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

