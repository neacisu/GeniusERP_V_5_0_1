/**
 * Settings Table Component
 * 
 * Reusable table component for settings lists with consistent styling
 */

import React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface SettingsTableColumn<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

export interface SettingsTableProps<T> {
  data: T[];
  columns: SettingsTableColumn<T>[];
  className?: string;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  loadingRows?: number;
  onRowClick?: (item: T) => void;
}

export default function SettingsTable<T>({
  data,
  columns,
  className,
  emptyState,
  isLoading = false,
  loadingRows = 5,
  onRowClick
}: SettingsTableProps<T>) {
  return (
    <div className={cn("border rounded-md", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                className={column.className}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: loadingRows }).map((_, rowIndex) => (
              <TableRow key={`loading-${rowIndex}`}>
                {columns.map((_, colIndex) => (
                  <TableCell key={`loading-cell-${rowIndex}-${colIndex}`}>
                    <div className="h-4 bg-gray-200 animate-pulse rounded-sm" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyState || (
                  <div className="text-muted-foreground">Nu există date disponibile</div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, rowIndex) => (
              <TableRow 
                key={rowIndex}
                className={onRowClick ? "cursor-pointer hover:bg-accent/50" : undefined}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column, colIndex) => (
                  <TableCell 
                    key={`${rowIndex}-${colIndex}`}
                    className={column.className}
                  >
                    {column.cell 
                      ? column.cell(item)
                      : column.accessorKey 
                        ? String(item[column.accessorKey] ?? '')
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}