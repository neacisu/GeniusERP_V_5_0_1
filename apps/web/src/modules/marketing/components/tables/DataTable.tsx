/**
 * Marketing DataTable Component
 * 
 * Reusable data table component for displaying marketing data 
 * with sorting, pagination, and filtering capabilities.
 */

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Filter,
  Search,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T; // Path to access the value
  accessorFn?: (row: T) => React.ReactNode; // Custom accessor function
  enableSorting?: boolean;
  enableFiltering?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  pageSize?: number;
  pageIndex?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  rowClickable?: boolean;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
  noDataMessage?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  pageSize = 10,
  pageIndex = 0,
  pageCount = 1,
  onPageChange,
  onSearch,
  rowClickable = false,
  onRowClick,
  getRowId,
  noDataMessage = "Nu există date",
  className = "",
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map((column) => column.id)
  );

  // Filter columns that should be displayed
  const filteredColumns = columns.filter((column) =>
    visibleColumns.includes(column.id)
  );

  // Handle sorting (to be implemented)
  const handleSort = (columnId: string) => {
    console.log("Sort by", columnId);
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  // Handle row click
  const handleRowClick = (row: T) => {
    if (rowClickable && onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        {onSearch && (
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-sm"
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8 w-full"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0.5 top-0.5 h-8 w-8 p-0"
                onClick={() => {
                  setSearchQuery("");
                  if (onSearch) onSearch("");
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Șterge căutarea</span>
              </Button>
            )}
          </form>
        )}

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Coloane</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.includes(column.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setVisibleColumns([...visibleColumns, column.id]);
                    } else {
                      setVisibleColumns(
                        visibleColumns.filter((id) => id !== column.id)
                      );
                    }
                  }}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {filteredColumns.map((column) => (
                <TableHead key={column.id} className="font-medium">
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {column.enableSorting && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-4 hover:bg-transparent"
                        onClick={() => handleSort(column.id)}
                      >
                        <ChevronsUpDown className="h-3 w-3" />
                        <span className="sr-only">Sortează</span>
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading state
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    {filteredColumns.map((column, colIndex) => (
                      <TableCell key={`loading-cell-${colIndex}`}>
                        <div className="h-4 bg-muted animate-pulse rounded-md w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={filteredColumns.length}
                  className="h-24 text-center"
                >
                  {noDataMessage}
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              data.map((row, rowIndex) => (
                <TableRow
                  key={getRowId ? getRowId(row) : rowIndex}
                  className={rowClickable ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => handleRowClick(row)}
                >
                  {filteredColumns.map((column) => (
                    <TableCell key={`${rowIndex}-${column.id}`}>
                      {column.accessorFn
                        ? column.accessorFn(row)
                        : column.accessorKey
                        ? (row[column.accessorKey] as React.ReactNode)
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {onPageChange && pageCount > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Pagina {pageIndex + 1} din {pageCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageIndex - 1)}
              disabled={pageIndex === 0}
            >
              Anterioară
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageIndex + 1)}
              disabled={pageIndex === pageCount - 1}
            >
              Următoare
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;