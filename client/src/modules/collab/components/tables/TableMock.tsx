// This is a temporary mock to avoid @tanstack/react-table dependency
// Once the proper dependency is available, this can be removed

export interface ColumnDef<T> {
  id?: string;
  accessorKey?: string;
  header?: any;
  cell?: any;
  enableSorting?: boolean;
  enableHiding?: boolean;
  filterFn?: any;
}

export type SortingState = any[];
export type ColumnFiltersState = any[];

export const getCoreRowModel = () => ({});
export const getPaginationRowModel = () => ({});
export const getSortedRowModel = () => ({});
export const getFilteredRowModel = () => ({});

export const useReactTable = (options: any) => {
  return {
    getHeaderGroups: () => [],
    getRowModel: () => ({ rows: [] }),
    getFilteredRowModel: () => ({ rows: [] }),
    getFilteredSelectedRowModel: () => ({ rows: [] }),
    getColumn: () => ({
      getFilterValue: () => '',
      setFilterValue: () => {}
    }),
    previousPage: () => {},
    nextPage: () => {},
    getCanPreviousPage: () => false,
    getCanNextPage: () => false,
    getIsAllPageRowsSelected: () => false,
    getIsSomePageRowsSelected: () => false,
    toggleAllPageRowsSelected: () => {}
  };
};

export const flexRender = (content: any) => content;