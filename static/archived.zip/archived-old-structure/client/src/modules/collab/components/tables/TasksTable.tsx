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
  ChevronDown, 
  CheckSquare, 
  Edit, 
  FileText, 
  Copy, 
  Trash, 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle,
  CalendarIcon
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
import { Progress } from "@/components/ui/progress";

import { Task, TaskStatus, TaskPriority } from '../../types';

interface TasksTableProps {
  tasks: Task[];
  isLoading?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

/**
 * Tabel pentru afișarea sarcinilor
 */
const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  isLoading = false,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  
  // Funcție pentru obținerea iconului de status
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return <Circle className="h-4 w-4 text-slate-500" />;
      case TaskStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case TaskStatus.REVIEW:
        return <CheckSquare className="h-4 w-4 text-purple-500" />;
      case TaskStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case TaskStatus.BLOCKED:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };
  
  // Funcție pentru obținerea clasei de culoare pentru status badge
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case TaskStatus.REVIEW:
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case TaskStatus.COMPLETED:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case TaskStatus.BLOCKED:
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  // Funcție pentru obținerea clasei de culoare pentru priority badge
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case TaskPriority.NORMAL:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case TaskPriority.HIGH:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  // Definirea coloanelor
  const columns: ColumnDef<Task>[] = [
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
        const task = row.original;
        return (
          <div className="flex items-center">
            <Link 
              href={`/collab/tasks/${task.id}`} 
              className="font-medium hover:underline truncate max-w-xs"
            >
              {task.title}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }: { column: any }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const status = row.getValue('status') as TaskStatus;
        const statusColor = getStatusColor(status);
        
        return onStatusChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 p-0 flex items-center">
                <Badge className={statusColor}>
                  {getStatusIcon(status)}
                  <span className="ml-1">{status}</span>
                </Badge>
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Schimbă status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.values(TaskStatus).map((s) => (
                <DropdownMenuItem 
                  key={s}
                  onClick={() => onStatusChange(row.original.id as string, s)}
                  className="flex items-center"
                >
                  {getStatusIcon(s)}
                  <span className="ml-2">{s}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Badge className={statusColor}>
            {getStatusIcon(status)}
            <span className="ml-1">{status}</span>
          </Badge>
        );
      },
      filterFn: (row: any, id: string, value: string) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'priority',
      header: ({ column }: { column: any }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Prioritate
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const priority = row.getValue('priority') as TaskPriority;
        return (
          <Badge className={getPriorityColor(priority)}>
            {priority}
          </Badge>
        );
      },
      filterFn: (row: any, id: string, value: string) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'assignedTo',
      header: 'Atribuit',
      cell: ({ row }: { row: any }) => {
        const assignedTo = row.getValue('assignedTo') as string | null;
        return assignedTo ? (
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {assignedTo.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="ml-2 text-sm">{assignedTo}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Neatribuit</span>
        );
      },
    },
    {
      accessorKey: 'progress',
      header: 'Progres',
      cell: ({ row }: { row: any }) => {
        const progress = row.getValue('progress') as number;
        return (
          <div className="w-24">
            <div className="flex justify-between text-xs mb-1">
              <span>{progress || 0}%</span>
            </div>
            <Progress value={progress || 0} className="h-2" />
          </div>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }: { column: any }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Termen
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const dueDate = row.getValue('dueDate') as string | null;
        if (!dueDate) return <span className="text-muted-foreground text-sm">Nespecificat</span>;
        
        const date = new Date(dueDate);
        const now = new Date();
        const isOverdue = date < now && row.original.status !== TaskStatus.COMPLETED;
        
        return (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
            <CalendarIcon className="h-4 w-4" />
            <span>{format(date, 'dd MMM yyyy', { locale: ro })}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: any }) => {
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
                <Link href={`/collab/tasks/${row.original.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Vezi detalii</span>
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Editează</span>
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(row.original)}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Duplică</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(row.original)}
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
    data: tasks,
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
                  Nu au fost găsite sarcini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Afișare <strong>{table.getFilteredRowModel().rows.length}</strong> din{' '}
          <strong>{tasks.length}</strong> sarcini.
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

export default TasksTable;