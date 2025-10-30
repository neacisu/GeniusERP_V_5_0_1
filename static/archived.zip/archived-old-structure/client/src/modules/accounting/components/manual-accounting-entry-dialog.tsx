/**
 * Manual Accounting Entry Dialog
 * 
 * Componentă pentru crearea notelor contabile manuale cu validări complete
 * Implementează cerințele OMFP 2634/2015 pentru note contabile
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Paperclip,
  RotateCcw,
  Calendar,
  Clock,
  AlertTriangle
} from "lucide-react";

/**
 * Interface pentru linia contabilă
 */
interface AccountingLine {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

/**
 * Interface pentru conturile disponibile
 */
interface Account {
  id: string;
  code: string;
  name: string;
  type: 'A' | 'P' | 'B'; // Active, Pasive, Bifunctional
  isActive: boolean;
}

/**
 * Props pentru dialog
 */
interface ManualAccountingEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (entryId: string) => void;
}

/**
 * Șabloane predefinite pentru operațiuni comune
 */
const ACCOUNTING_TEMPLATES = {
  depreciation: {
    name: "Amortizare imobilizări",
    description: "Înregistrare amortizare lunară",
    lines: [
      { accountCode: "6811", description: "Cheltuieli amortizare", debit: 0, credit: 0 },
      { accountCode: "281", description: "Amortizare cumulată", debit: 0, credit: 0 }
    ]
  },
  accrual: {
    name: "Cheltuieli înregistrate în avans",
    description: "Înregistrare cheltuieli de regularizat",
    lines: [
      { accountCode: "471", description: "Cheltuieli înregistrate în avans", debit: 0, credit: 0 },
      { accountCode: "404", description: "Furnizori de imobilizări", debit: 0, credit: 0 }
    ]
  },
  provision: {
    name: "Constituire provizioane",
    description: "Provizioane pentru riscuri și cheltuieli",
    lines: [
      { accountCode: "681", description: "Cheltuieli cu provizioanele", debit: 0, credit: 0 },
      { accountCode: "151", description: "Provizioane", debit: 0, credit: 0 }
    ]
  }
};

export default function ManualAccountingEntryDialog({ 
  isOpen, 
  onClose, 
  onSuccess 
}: ManualAccountingEntryDialogProps) {
  // State pentru formularul principal
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [isStorno, setIsStorno] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  // State pentru liniile contabile
  const [lines, setLines] = useState<Array<{
    id: string;
    accountCode: string;
    description: string;
    debitAmount: string;
    creditAmount: string;
  }>>([
    { id: "1", accountCode: "", description: "", debitAmount: "0", creditAmount: "0" }
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch accounts pentru selector
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounting/chart-of-accounts'],
    select: (response: any) => Array.isArray(response) ? response : (response?.data || [])
  });

  // Calculări pentru validare
  const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debitAmount || "0"), 0);
  const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.creditAmount || "0"), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Mutație pentru crearea notei contabile
  const createEntryMutation = useMutation({
    mutationFn: async (entryData: any) => {
      const response = await fetch('/api/accounting/manual-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Eroare la crearea notei contabile');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Nota contabilă creată cu succes",
        description: `Numărul înregistrării: ${data.journalNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/note-contabil'] });
      onSuccess?.(data.id);
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare la crearea notei contabile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Funcții helper
  const resetForm = () => {
    setEntryDate(new Date().toISOString().split('T')[0]);
    setDocumentDate(new Date().toISOString().split('T')[0]);
    setDescription("");
    setIsStorno(false);
    setSelectedTemplate("");
    setLines([
      { id: "1", accountCode: "", description: "", debitAmount: "0", creditAmount: "0" }
    ]);
  };

  const addLine = () => {
    const newId = (Date.now() + Math.random()).toString();
    setLines([...lines, {
      id: newId,
      accountCode: "",
      description: "",
      debitAmount: "0",
      creditAmount: "0"
    }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Auto-clear opposite field when entering amount
    if (field === 'debitAmount' && parseFloat(value) > 0) {
      newLines[index].creditAmount = "0";
    } else if (field === 'creditAmount' && parseFloat(value) > 0) {
      newLines[index].debitAmount = "0";
    }
    
    setLines(newLines);
  };

  const applyTemplate = (templateKey: string) => {
    const template = ACCOUNTING_TEMPLATES[templateKey as keyof typeof ACCOUNTING_TEMPLATES];
    if (!template) return;

    setDescription(template.description);
    setLines(template.lines.map((line, index) => ({
      id: (index + 1).toString(),
      accountCode: line.accountCode,
      description: line.description,
      debitAmount: line.debit.toString(),
      creditAmount: line.credit.toString()
    })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validări
    if (!description.trim()) {
      toast({
        title: "Descriere lipsă",
        description: "Introduceți o descriere pentru nota contabilă",
        variant: "destructive",
      });
      return;
    }

    if (!isBalanced) {
      toast({
        title: "Notă neechilibrată",
        description: "Suma debitelor trebuie să fie egală cu suma creditelor",
        variant: "destructive",
      });
      return;
    }

    const invalidLines = lines.filter(line => 
      !line.accountCode || 
      (!line.debitAmount && !line.creditAmount) ||
      (parseFloat(line.debitAmount || "0") === 0 && parseFloat(line.creditAmount || "0") === 0)
    );

    if (invalidLines.length > 0) {
      toast({
        title: "Linii incomplete",
        description: "Toate liniile trebuie să aibă cont și sumă specificate",
        variant: "destructive",
      });
      return;
    }

    // Pregătește datele pentru server
    const entryData = {
      entryDate: new Date(entryDate),
      documentDate: new Date(documentDate),
      description,
      isStorno,
      lines: lines.map(line => ({
        accountCode: line.accountCode,
        description: line.description,
        debitAmount: parseFloat(line.debitAmount || "0") * (isStorno ? -1 : 1),
        creditAmount: parseFloat(line.creditAmount || "0") * (isStorno ? -1 : 1)
      }))
    };

    createEntryMutation.mutate(entryData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getAccountName = (accountCode: string) => {
    const account = accounts?.find(acc => acc.code === accountCode);
    return account ? account.name : '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Notă Contabilă Manuală
          </DialogTitle>
          <DialogDescription>
            Creați o înregistrare contabilă manuală conform OMFP 2634/2015
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informații generale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entry-date" className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Data înregistrării *
              </Label>
              <Input 
                id="entry-date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="document-date" className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Data documentului
              </Label>
              <Input 
                id="document-date"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descriere operațiune *</Label>
            <Input 
              id="description"
              placeholder="Ex: Înregistrare amortizare lunară, Închidere venituri și cheltuieli..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Șabloane și opțiuni */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template">Șablon predefinit (opțional)</Label>
              <Select value={selectedTemplate} onValueChange={(value) => {
                setSelectedTemplate(value);
                if (value) applyTemplate(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectați șablon..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Fără șablon</SelectItem>
                  {Object.entries(ACCOUNTING_TEMPLATES).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 mt-6">
              <Checkbox 
                id="is-storno"
                checked={isStorno}
                onCheckedChange={(checked) => setIsStorno(checked as boolean)}
              />
              <Label htmlFor="is-storno" className="cursor-pointer flex items-center">
                <RotateCcw className="h-4 w-4 mr-1" />
                Înregistrare de stornare
              </Label>
            </div>
          </div>

          <Separator />

          {/* Linii contabile */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Înregistrări Contabile</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addLine}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adaugă Linie
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-40">Cont</TableHead>
                    <TableHead>Descriere</TableHead>
                    <TableHead className="text-right w-32">Debit</TableHead>
                    <TableHead className="text-right w-32">Credit</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Select 
                          value={line.accountCode}
                          onValueChange={(value) => updateLine(index, 'accountCode', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Cont..." />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts?.filter(acc => acc.isActive).map(account => (
                              <SelectItem key={account.id} value={account.code}>
                                {account.code} - {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {line.accountCode && (
                          <div className="text-xs text-gray-500 mt-1">
                            {getAccountName(line.accountCode)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Descriere linie..." 
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          className="text-right"
                          value={line.debitAmount}
                          onChange={(e) => updateLine(index, 'debitAmount', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          className="text-right"
                          value={line.creditAmount}
                          onChange={(e) => updateLine(index, 'creditAmount', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => removeLine(index)}
                          disabled={lines.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <tfoot>
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={2} className="px-4 py-2 text-right">
                      Total:
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(totalDebit)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(totalCredit)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>

            {/* Indicator echilibrare */}
            <div className={`flex items-center text-sm ${isBalanced ? 'text-green-600' : 'text-red-500'}`}>
              {isBalanced ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <span>Nota contabilă este echilibrată (Debit = Credit)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Diferență: {formatCurrency(Math.abs(totalDebit - totalCredit))}. Suma debitelor trebuie să fie egală cu suma creditelor.</span>
                </>
              )}
            </div>

            {isStorno && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center text-yellow-800 text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>Înregistrare de stornare: semnele vor fi inversate în jurnale</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={createEntryMutation.isPending}
            >
              Anulează
            </Button>
            <Button 
              type="submit" 
              disabled={!isBalanced || !description.trim() || createEntryMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {createEntryMutation.isPending ? "Se salvează..." : "Salvează Nota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
