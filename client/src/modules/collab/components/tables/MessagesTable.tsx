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
  Star,
  Clock,
  MessageCircle,
  Mail,
  X,
  CheckCircle,
  AlertCircle,
  Bell,
  Archive,
  Paperclip
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

import { MessageType, Message } from '../../types';

interface MessagesTableProps {
  messages: Message[];
  isLoading?: boolean;
  onMarkRead?: (messageId: string, isRead: boolean) => void;
  onStar?: (messageId: string, isStarred: boolean) => void;
  onDelete?: (message: Message) => void;
  onArchive?: (message: Message) => void;
}

/**
 * Tabel pentru afișarea mesajelor
 */
const MessagesTable: React.FC<MessagesTableProps> = ({
  messages,
  isLoading = false,
  onMarkRead,
  onStar,
  onDelete,
  onArchive
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  
  // Obține iconul pentru mesaj în funcție de tip
  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case MessageType.DIRECT:
        return <Mail className="h-4 w-4 text-blue-600" />;
      case MessageType.THREAD:
        return <MessageCircle className="h-4 w-4 text-emerald-600" />;
      case MessageType.SYSTEM:
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case MessageType.NOTIFICATION:
        return <Bell className="h-4 w-4 text-purple-600" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };
  
  // Formatează data relativ (ex: "acum 2 ore")
  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'acum câteva secunde';
    if (diffSeconds < 3600) return `acum ${Math.floor(diffSeconds / 60)} minute`;
    if (diffSeconds < 86400) return `acum ${Math.floor(diffSeconds / 3600)} ore`;
    if (diffSeconds < 604800) return `acum ${Math.floor(diffSeconds / 86400)} zile`;
    
    return format(messageDate, 'dd MMM yyyy', { locale: ro });
  };
  
  // Definirea coloanelor
  const columns: ColumnDef<Message>[] = [
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
      accessorKey: 'isStarred',
      header: '',
      cell: ({ row }: { row: any }) => {
        const message = row.original;
        return onStar ? (
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => onStar(message.id, !message.isStarred)}
          >
            <Star 
              className={`h-4 w-4 ${message.isStarred ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} 
            />
            <span className="sr-only">Star</span>
          </Button>
        ) : (
          message.isStarred && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'type',
      header: '',
      cell: ({ row }: { row: any }) => {
        const type = row.getValue('type') as MessageType;
        return getMessageTypeIcon(type);
      },
      enableSorting: false,
    },
    {
      accessorKey: 'sender',
      header: 'Expeditor',
      cell: ({ row }: { row: any }) => {
        const sender = row.getValue('sender') as string;
        return (
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback>
                {sender.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{sender}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'subject',
      header: ({ column }: { column: any }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Subiect
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const message = row.original;
        return (
          <Link 
            href={`/collab/messages/${message.id}`} 
            className={`font-medium truncate max-w-xs flex gap-1 items-center hover:underline ${!message.isRead ? 'font-semibold' : ''}`}
          >
            <span className="truncate">{message.subject}</span>
            {message.attachmentCount && message.attachmentCount > 0 && (
              <span className="text-slate-400 shrink-0">
                <Paperclip className="h-4 w-4" />
              </span>
            )}
          </Link>
        );
      },
    },
    {
      accessorKey: 'content',
      header: 'Preview',
      cell: ({ row }: { row: any }) => {
        const content = row.getValue('content') as string;
        const previewText = content.slice(0, 60) + (content.length > 60 ? '...' : '');
        return (
          <span className="text-muted-foreground text-sm truncate max-w-xs block">
            {previewText}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Data',
      cell: ({ row }: { row: any }) => {
        const createdAt = row.getValue('createdAt') as string | Date;
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{formatRelativeTime(createdAt)}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: any }) => {
        const message = row.original;
        
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
                <Link href={`/collab/messages/${message.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Vezi detalii</span>
                </Link>
              </DropdownMenuItem>
              {onMarkRead && (
                <DropdownMenuItem onClick={() => onMarkRead(message.id, !message.isRead)}>
                  {message.isRead ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      <span>Marchează ca necitit</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span>Marchează ca citit</span>
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {onStar && (
                <DropdownMenuItem onClick={() => onStar(message.id, !message.isStarred)}>
                  <Star className={`mr-2 h-4 w-4 ${message.isStarred ? 'fill-amber-500' : ''}`} />
                  <span>{message.isStarred ? 'Elimină stea' : 'Marchează cu stea'}</span>
                </DropdownMenuItem>
              )}
              {message.type === MessageType.DIRECT && (
                <DropdownMenuItem asChild>
                  <Link href={`/collab/messages/new?reply=${message.id}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Răspunde</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(message)}>
                  <Archive className="mr-2 h-4 w-4" />
                  <span>Arhivează</span>
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(message)}
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
    data: messages,
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
          placeholder="Filtrează după subiect..."
          value={((table as any).getColumn('subject')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            (table as any).getColumn('subject')?.setFilterValue(event.target.value)
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
                  className={!row.original.isRead ? 'bg-slate-50' : ''}
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
                  Nu au fost găsite mesaje.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Afișare <strong>{table.getFilteredRowModel().rows.length}</strong> din{' '}
          <strong>{messages.length}</strong> mesaje.
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

export default MessagesTable;