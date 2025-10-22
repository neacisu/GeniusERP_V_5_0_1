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
  FileText,
  Copy, 
  Trash, 
  Eye,
  Paperclip,
  Clock,
  Pin,
  Tag,
  LinkIcon
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

import { Note } from '../../types';

interface NotesTableProps {
  notes: Note[];
  isLoading?: boolean;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onTogglePin?: (noteId: string, isPinned: boolean) => void;
}

/**
 * Tabel pentru afișarea notițelor
 */
const NotesTable: React.FC<NotesTableProps> = ({
  notes,
  isLoading = false,
  onEdit,
  onDelete,
  onTogglePin
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  
  // Formatează data relativ (ex: "acum 2 ore")
  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffSeconds = Math.floor((now.getTime() - noteDate.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'acum câteva secunde';
    if (diffSeconds < 3600) return `acum ${Math.floor(diffSeconds / 60)} minute`;
    if (diffSeconds < 86400) return `acum ${Math.floor(diffSeconds / 3600)} ore`;
    if (diffSeconds < 604800) return `acum ${Math.floor(diffSeconds / 86400)} zile`;
    
    return format(noteDate, 'dd MMM yyyy', { locale: ro });
  };
  
  // Extrage previzualizarea conținutului
  const getContentPreview = (content?: string) => {
    if (!content) return '';
    
    // Înlătură markdown-ul pentru afișare
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*|__|\*|_|~~|`/g, '') // Remove formatting
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
      .replace(/<[^>]*>/g, ''); // Remove HTML tags
    
    return cleanContent.substring(0, 100) + (cleanContent.length > 100 ? '...' : '');
  };
  
  // Definirea coloanelor
  const columns: ColumnDef<Note>[] = [
    {
      id: 'select',
      header: ({ table }: { table: any }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: any }) => (
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
      header: ({ column }: { column: any }) => (
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
      cell: ({ row }: { row: any }) => {
        const note = row.original;
        return (
          <div className="flex items-center">
            {note.isPinned && (
              <Pin className="h-3 w-3 mr-2 text-amber-500" />
            )}
            <Link 
              href={`/collab/notes/${note.id}`} 
              className="font-medium hover:underline truncate max-w-xs"
            >
              {note.title}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: 'content',
      header: 'Conținut',
      cell: ({ row }: { row: any }) => {
        const content = row.getValue('content') as string | undefined;
        return (
          <div className="max-w-xs truncate text-muted-foreground text-sm">
            {getContentPreview(content)}
          </div>
        );
      },
    },
    {
      id: 'tags',
      header: 'Etichete',
      cell: ({ row }: { row: any }) => {
        const note = row.original;
        const tags = note.tags || [];
        
        return tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs px-1.5 py-0"
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Fără etichete</span>
        );
      },
    },
    {
      id: 'relations',
      header: 'Relații',
      cell: ({ row }: { row: any }) => {
        const note = row.original;
        const relatedItems = note.relatedItems || [];
        
        return relatedItems.length > 0 ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <LinkIcon className="h-3 w-3 mr-1" />
              {relatedItems.length}
            </Badge>
            
            {note.attachmentCount && note.attachmentCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Paperclip className="h-3 w-3 mr-1" />
                {note.attachmentCount}
              </Badge>
            )}
          </div>
        ) : note.attachmentCount && note.attachmentCount > 0 ? (
          <Badge variant="secondary" className="text-xs">
            <Paperclip className="h-3 w-3 mr-1" />
            {note.attachmentCount}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Creat de',
      cell: ({ row }: { row: any }) => {
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
      header: ({ column }: { column: any }) => (
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
      cell: ({ row }: { row: any }) => {
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
      id: 'actions',
      cell: ({ row }: { row: any }) => {
        const note = row.original;
        
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
                <Link href={`/collab/notes/${note.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Vezi detalii</span>
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(note)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Editează</span>
                </DropdownMenuItem>
              )}
              {onTogglePin && (
                <DropdownMenuItem onClick={() => onTogglePin(note.id as string, !note.isPinned)}>
                  <Pin className="mr-2 h-4 w-4" />
                  <span>{note.isPinned ? 'Anulează fixare' : 'Fixează'}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(note)}
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
    data: notes,
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
          value={((table as any).getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            (table as any).getColumn('title')?.setFilterValue(event.target.value)
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
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : (flexRender as any)(
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
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                      {(flexRender as any)(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nu au fost găsite notițe.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Afișare <strong>{table.getFilteredRowModel().rows.length}</strong> din{' '}
          <strong>{notes.length}</strong> notițe.
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

export default NotesTable;