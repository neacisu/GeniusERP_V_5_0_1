import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Account, InsertJournalEntry, InsertJournalLine } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useForm, SubmitHandler } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type TransactionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

type JournalLineForm = {
  accountId: string;
  description: string;
  debit: string;
  credit: string;
};

type TransactionForm = {
  date: string;
  number: string;
  description: string;
  lines: JournalLineForm[];
};

export default function TransactionDialog({ isOpen, onClose }: TransactionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<JournalLineForm[]>([
    { accountId: "", description: "", debit: "0", credit: "0" }
  ]);

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TransactionForm>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      number: "",
      description: "",
      lines: lines,
    }
  });

  const addLine = () => {
    setLines([...lines, { accountId: "", description: "", debit: "0", credit: "0" }]);
  };

  const removeLine = (index: number) => {
    const newLines = [...lines];
    newLines.splice(index, 1);
    setLines(newLines);
  };

  const createTransactionMutation = useMutation({
    mutationFn: async (data: { entry: InsertJournalEntry, lines: InsertJournalLine[] }) => {
      return await apiRequest("/api/journal-entries", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/recent'] });
      toast({
        title: "Succes",
        description: "Tranzacția a fost înregistrată cu succes.",
      });
      onClose();
      reset();
      setLines([{ accountId: "", description: "", debit: "0", credit: "0" }]);
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: `Nu s-a putut înregistra tranzacția: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit: SubmitHandler<TransactionForm> = (data) => {
    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    
    data.lines.forEach(line => {
      totalDebit += parseFloat(line.debit || "0");
      totalCredit += parseFloat(line.credit || "0");
    });
    
    // Validate debits equal credits (double-entry accounting principle)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast({
        title: "Eroare",
        description: "Suma debitelor trebuie să fie egală cu suma creditelor conform principiului contabilității în partidă dublă.",
        variant: "destructive",
      });
      return;
    }
    
    // Create the journal entry
    const journalEntry: InsertJournalEntry = {
      companyId: "default-company-id", // This would come from company settings
      date: new Date(data.date),
      number: data.number,
      description: data.description,
      totalDebit: totalDebit.toString(),
      totalCredit: totalCredit.toString(),
      createdBy: "current-user-id", // This would come from auth context
    };
    
    // Create the journal lines
    const journalLines: InsertJournalLine[] = data.lines.map(line => ({
      journalId: "", // This will be filled by the server
      accountId: line.accountId,
      description: line.description,
      debit: line.debit || "0",
      credit: line.credit || "0",
    }));
    
    createTransactionMutation.mutate({ entry: journalEntry, lines: journalLines });
  };

  // Calculate totals
  const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit || "0"), 0);
  const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit || "0"), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Adaugă Tranzacție Nouă</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="date">Dată Tranzacție</Label>
              <Input 
                id="date" 
                type="date" 
                {...register("date", { required: "Data este obligatorie" })}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="number">Număr Document</Label>
              <Input 
                id="number" 
                type="text" 
                placeholder="ex: #INV-2024-001" 
                {...register("number")}
              />
            </div>
          </div>
          
          <div className="mb-6">
            <Label htmlFor="description">Descriere</Label>
            <Input 
              id="description" 
              type="text" 
              placeholder="Descriere tranzacție..." 
              {...register("description", { required: "Descrierea este obligatorie" })}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Label>Înregistrări Contabile</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addLine}
                className="text-primary"
              >
                <span className="material-icons text-sm mr-1">add</span>
                Adaugă Rând
              </Button>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Cont</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Descriere</th>
                    <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">Debit (RON)</th>
                    <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">Credit (RON)</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-2 px-4">
                        <select 
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                          {...register(`lines.${index}.accountId` as const, { 
                            required: "Contul este obligatoriu" 
                          })}
                        >
                          <option value="">Selectează cont</option>
                          {isLoadingAccounts ? (
                            <option disabled>Încărcare conturi...</option>
                          ) : (
                            accounts?.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.code} - {account.name}
                              </option>
                            ))
                          )}
                        </select>
                        {errors.lines?.[index]?.accountId && (
                          <p className="text-red-500 text-xs mt-1">{errors.lines[index]?.accountId?.message}</p>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <Input 
                          type="text" 
                          className="w-full px-2 py-1 text-sm" 
                          placeholder="Descriere..."
                          {...register(`lines.${index}.description` as const)}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <Input 
                          type="text" 
                          className="w-full px-2 py-1 text-sm text-right" 
                          defaultValue="0.00"
                          {...register(`lines.${index}.debit` as const, {
                            pattern: {
                              value: /^[0-9]*\.?[0-9]*$/,
                              message: "Trebuie să fie un număr valid"
                            }
                          })}
                          onChange={(e) => {
                            const value = e.target.value;
                            const newLines = [...lines];
                            newLines[index].debit = value;
                            setLines(newLines);
                          }}
                        />
                        {errors.lines?.[index]?.debit && (
                          <p className="text-red-500 text-xs mt-1">{errors.lines[index]?.debit?.message}</p>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <Input 
                          type="text" 
                          className="w-full px-2 py-1 text-sm text-right" 
                          defaultValue="0.00"
                          {...register(`lines.${index}.credit` as const, {
                            pattern: {
                              value: /^[0-9]*\.?[0-9]*$/,
                              message: "Trebuie să fie un număr valid"
                            }
                          })}
                          onChange={(e) => {
                            const value = e.target.value;
                            const newLines = [...lines];
                            newLines[index].credit = value;
                            setLines(newLines);
                          }}
                        />
                        {errors.lines?.[index]?.credit && (
                          <p className="text-red-500 text-xs mt-1">{errors.lines[index]?.credit?.message}</p>
                        )}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button 
                          type="button"
                          className="text-gray-500 hover:text-red-500"
                          onClick={() => removeLine(index)}
                          disabled={lines.length === 1}
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={2} className="py-2 px-4 text-sm text-right">Total:</td>
                    <td className="py-2 px-4 text-sm text-right">{totalDebit.toFixed(2)}</td>
                    <td className="py-2 px-4 text-sm text-right">{totalCredit.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className={`text-xs flex items-center mt-2 ${isBalanced ? 'text-info-main' : 'text-error-main'}`}>
              <span className="material-icons text-xs mr-1">{isBalanced ? 'info' : 'warning'}</span>
              {isBalanced 
                ? "Tranzacție echilibrată (Debit = Credit) conform principiului contabilității în partidă dublă"
                : "Tranzacție neechilibrată! Debitele trebuie să fie egale cu creditele."
              }
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Anulează
            </Button>
            <Button 
              type="submit" 
              disabled={createTransactionMutation.isPending || !isBalanced}
            >
              {createTransactionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se procesează...
                </>
              ) : (
                "Salvează Tranzacția"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
