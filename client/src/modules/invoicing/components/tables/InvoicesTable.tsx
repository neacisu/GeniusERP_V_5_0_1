/**
 * Invoices Table Component
 * 
 * Displays a table of invoices with sorting, filtering, and actions.
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
// TODO: Install @tanstack/react-table package
// import type {
//   ColumnDef,
//   SortingState
// } from '@tanstack/react-table';
// import {
//   flexRender,
//   getCoreRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   useReactTable,
// } from '@tanstack/react-table';

// Temporary type definitions until @tanstack/react-table is installed
type ColumnDef<T> = any;
type SortingState = any;
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { formatDate } from '../../utils/invoiceCalculations';
import { Invoice, InvoiceStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  ArrowUpDown,
  MoreHorizontalIcon,
  FileEditIcon,
  PrinterIcon,
  SendIcon,
  CreditCardIcon,
  FileCheckIcon,
  FileX2Icon,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
} from 'lucide-react';
import { formatCurrency } from '../../utils/invoiceCalculations';

interface InvoicesTableProps {
  data: Invoice[];
  totalCount: number;
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  isLoading?: boolean;
  onPaginationChange: (pageIndex: number, pageSize: number) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onSearchChange?: (searchTerm: string) => void;
  onStatusFilterChange?: (status: string) => void;
  onValidateInvoice?: (invoiceId: string) => void;
  onCancelInvoice?: (invoiceId: string) => void;
  onMarkAsPaid?: (invoiceId: string) => void;
  onDownloadPdf?: (invoiceId: string) => void;
  onSendEmail?: (invoiceId: string) => void;
}

export function InvoicesTable({
  data,
  totalCount,
  pageCount,
  pageIndex,
  pageSize,
  isLoading = false,
  onPaginationChange,
  onSortingChange,
  onSearchChange,
  onStatusFilterChange,
  onValidateInvoice,
  onCancelInvoice,
  onMarkAsPaid,
  onDownloadPdf,
  onSendEmail,
}: InvoicesTableProps) {
  const [_, setLocation] = useLocation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Table columns definition
  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nr. factură
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.invoiceNumber}
        </div>
      ),
    },
    {
      accessorKey: 'customerName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Client
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.original.customerName}</div>,
    },
    {
      accessorKey: 'issueDate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Data emiterii
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{formatDate(new Date(row.original.issueDate))}</div>,
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Scadență
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{formatDate(new Date(row.original.dueDate))}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status as InvoiceStatus} />
      ),
    },
    {
      accessorKey: 'grossTotal',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="justify-end"
          >
            Total
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.original.grossTotal.toString());
        return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invoice = row.original;
        
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Deschide meniu</span>
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => setLocation(`/facturare/invoices/${invoice.id}`)}>
                  <FileEditIcon className="h-4 w-4 mr-2" />
                  <span>Vizualizează</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setLocation(`/facturare/invoices/edit/${invoice.id}`)}>
                  <FileEditIcon className="h-4 w-4 mr-2" />
                  <span>Editează</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => onDownloadPdf && onDownloadPdf(invoice.id)}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  <span>Descarcă PDF</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => onSendEmail && onSendEmail(invoice.id)}>
                  <SendIcon className="h-4 w-4 mr-2" />
                  <span>Trimite pe email</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {invoice.status === InvoiceStatus.DRAFT && (
                  <DropdownMenuItem onClick={() => onValidateInvoice && onValidateInvoice(invoice.id)}>
                    <FileCheckIcon className="h-4 w-4 mr-2" />
                    <span>Validează</span>
                  </DropdownMenuItem>
                )}
                
                {(invoice.status === InvoiceStatus.VALIDATED || invoice.status === InvoiceStatus.PENDING) && (
                  <DropdownMenuItem onClick={() => onMarkAsPaid && onMarkAsPaid(invoice.id)}>
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    <span>Marchează ca plătită</span>
                  </DropdownMenuItem>
                )}
                
                {invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.CANCELED && (
                  <DropdownMenuItem onClick={() => onCancelInvoice && onCancelInvoice(invoice.id)}>
                    <FileX2Icon className="h-4 w-4 mr-2" />
                    <span>Anulează</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Set up the table
  const table = useReactTable({
    data,
    columns,
    onSortingChange: (updater: any) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    manualPagination: true,
    pageCount,
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Add debounce to improve performance when typing
    const timeoutId = setTimeout(() => {
      onSearchChange?.(e.target.value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  // Placeholder for status options
  const statusOptions = [
    { value: '', label: 'Toate statusurile' },
    { value: InvoiceStatus.DRAFT, label: 'Ciornă' },
    { value: InvoiceStatus.PENDING, label: 'În așteptare' },
    { value: InvoiceStatus.VALIDATED, label: 'Validată' },
    { value: InvoiceStatus.PAID, label: 'Plătită' },
    { value: InvoiceStatus.CANCELED, label: 'Anulată' },
    { value: InvoiceStatus.OVERDUE, label: 'Depășită' },
    { value: InvoiceStatus.PARTIAL, label: 'Plată parțială' },
  ];

  return (
    <div className="space-y-4">
      {/* Table filters */}
      <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Caută facturi..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="max-w-sm"
          />
          <Select onValueChange={(value) => onStatusFilterChange?.(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toate statusurile" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/facturare/invoices/new')}
          >
            Factură nouă
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Se încarcă...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setLocation(`/facturare/invoices/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nu s-au găsit rezultate.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {totalCount > 0 ? (
            <>
              Se afișează {pageIndex * pageSize + 1} - {Math.min((pageIndex + 1) * pageSize, totalCount)} din {totalCount} înregistrări
            </>
          ) : (
            'Nu există înregistrări'
          )}
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPaginationChange(0, pageSize)}
                  disabled={pageIndex === 0}
                >
                  <ChevronFirst className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Prima pagină</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPaginationChange(pageIndex - 1, pageSize)}
                  disabled={pageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pagina anterioară</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPaginationChange(pageIndex + 1, pageSize)}
                  disabled={pageIndex === pageCount - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pagina următoare</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPaginationChange(pageCount - 1, pageSize)}
                  disabled={pageIndex === pageCount - 1}
                >
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ultima pagină</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPaginationChange(0, Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}