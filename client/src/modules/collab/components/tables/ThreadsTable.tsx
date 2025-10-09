import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel
} from './TableMock';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  Edit, 
  MessageSquare,
  Copy, 
  Trash, 
  Eye,
  Heart,
  Clock,
  Pin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

import { Thread, CommunityCategory } from '../../types';

interface ThreadsTableProps {
  threads: Thread[];
  isLoading?: boolean;
  onEdit?: (thread: Thread) => void;
  onDelete?: (thread: Thread) => void;
  onTogglePin?: (threadId: string, isPinned: boolean) => void;
  showCategory?: boolean;
  isCommunityTable?: boolean;
}

/**
 * Tabel pentru afișarea thread-urilor/discuțiilor
 */
const ThreadsTable: React.FC<ThreadsTableProps> = ({
  threads,
  isLoading = false,
  onEdit,
  onDelete,
  onTogglePin,
  showCategory = false,
  isCommunityTable = false
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  
  // Funcție pentru obținerea clasei de culoare pentru category badge
  const getCategoryColor = (category?: CommunityCategory) => {
    switch (category) {
      case CommunityCategory.ANUNTURI:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case CommunityCategory.INTREBARI:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case CommunityCategory.IDEI:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case CommunityCategory.EVENIMENTE:
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case CommunityCategory.RESURSE:
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case CommunityCategory.TUTORIALE:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  // Formatează data relativ (ex: "acum 2 ore")
  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const threadDate = new Date(date);
    const diffSeconds = Math.floor((now.getTime() - threadDate.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'acum câteva secunde';
    if (diffSeconds < 3600) return `acum ${Math.floor(diffSeconds / 60)} minute`;
    if (diffSeconds < 86400) return `acum ${Math.floor(diffSeconds / 3600)} ore`;
    if (diffSeconds < 604800) return `acum ${Math.floor(diffSeconds / 86400)} zile`;
    
    return format(threadDate, 'dd MMM yyyy', { locale: ro });
  };
  
  // Definirea coloanelor de bază
  let columns: ColumnDef<Thread>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Titlu
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const thread = row.original;
        return (
          <div className="flex items-center">
            {thread.isPinned && (
              <Pin className="h-3 w-3 mr-2 text-amber-500" />
            )}
            <Link 
              href={isCommunityTable 
                ? `/collab/community/${thread.category || 'general'}/${thread.id}` 
                : `/collab/threads/${thread.id}`
              } 
              className="font-medium hover:underline truncate max-w-xs"
            >
              {thread.title}
            </Link>
          </div>
        );
      },
    }
  ];
  
  // Adaugă coloana de categorie dacă este cerută
  if (showCategory) {
    columns.push({
      accessorKey: 'category',
      header: 'Categorie',
      cell: ({ row }) => {
        const category = row.getValue('category') as CommunityCategory | undefined;
        return category ? (
          <Badge className={getCategoryColor(category)}>
            {category}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Generală</span>
        );
      },
      filterFn: (row: any, id: string, value: string) => {
        return value.includes(row.getValue(id) || '');
      },
    });
  }
  
  // Adaugă restul coloanelor comune
  columns = [
    ...columns,
    {
      accessorKey: 'createdBy',
      header: 'Creat de',
      cell: ({ row }) => {
        const createdBy = row.getValue('createdBy') as string | undefined;
        return createdBy ? (
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {createdBy.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="ml-2 text-sm">{createdBy}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Sistem</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Data
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue('createdAt') as string | Date;
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatRelativeTime(createdAt)}</span>
          </div>
        );
      },
    },
    {
      id: 'stats',
      header: 'Statistici',
      cell: ({ row }) => {
        const thread = row.original;
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{thread.viewCount || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{thread.replyCount || 0}</span>
            </div>
            {isCommunityTable && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{thread.likeCount || 0}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const thread = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Meniu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link 
                  href={isCommunityTable 
                    ? `/collab/community/${thread.category || 'general'}/${thread.id}` 
                    : `/collab/threads/${thread.id}`
                  }
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Vezi detalii</span>
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(thread)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Editează</span>
                </DropdownMenuItem>
              )}
              {onTogglePin && (
                <DropdownMenuItem onClick={() => onTogglePin(thread.id as string, !thread.isPinned)}>
                  <Pin className="mr-2 h-4 w-4" />
                  <span>{thread.isPinned ? 'Anulează fixare' : 'Fixează'}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(thread)}
                  className="text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Șterge</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  
  const table = useReactTable({
    data: threads,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filtrează după titlu..."
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('title')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} selectate
            </span>
            <Button variant="outline" size="sm">
              Acțiune bulk
            </Button>
          </div>
        )}
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {Array.from({ length: columns.length }).map((_, cellIndex) => (
                    <TableCell key={`loading-cell-${cellIndex}`}>
                      <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isCommunityTable ? 'Nu au fost găsite postări în comunitate.' : 'Nu au fost găsite discuții.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Afișare <strong>{table.getFilteredRowModel().rows.length}</strong> din{' '}
          <strong>{threads.length}</strong> {isCommunityTable ? 'postări' : 'discuții'}.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Următor
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThreadsTable;