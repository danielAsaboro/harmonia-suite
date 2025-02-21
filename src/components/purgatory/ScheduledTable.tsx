// /components/purgatory/ScheduledTable.tsx
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
  RowSelectionState,
} from "@tanstack/react-table";
import { columns, ScheduledItem } from "./Columns";
import { TweetPreview } from "./TweetPreview";
import { TableToolbar } from "./TableToolbar";
import { TablePagination } from "./TablePagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Table as TableType, Row } from "@tanstack/react-table";

interface HoverState {
  item: ScheduledItem;
  position: {
    x: number;
    y: number;
  };
}

interface ScheduledTableProps {
  items: ScheduledItem[];
  initialSorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  className?: string;
}

export function ScheduledTable({
  items,
  initialSorting = [],
  onSortingChange,
  className = "",
}: ScheduledTableProps) {
  
  // Table State
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");

  // UI State
  const [hoverItem, setHoverItem] = useState<HoverState | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  // Add selection column to our columns
  const columnsWithSelect = [
    {
      id: "select",
      header: ({ table }: { table: TableType<ScheduledItem> }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: Row<ScheduledItem> }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    ...columns,
  ];

  const table = useReactTable({
    data: items,
    columns: columnsWithSelect,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    pageCount: Math.ceil(items.length / pageSize),
  });

  const handleSearch = (term: string) => {
    setGlobalFilter(term);
    table.setGlobalFilter(term);
  };

  const handleFilter = (filter: string) => {
    // Implement filter logic based on type, date, etc.
    switch (filter) {
      case "tweet":
      case "thread":
        table.getColumn("type")?.setFilterValue(filter);
        break;
      case "today":
        // Implement date filtering
        const today = new Date();
        table.getColumn("scheduledFor")?.setFilterValue((value: Date) => {
          return value.toDateString() === today.toDateString();
        });
        break;
      case "week":
        // Filter for this week
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        table.getColumn("scheduledFor")?.setFilterValue((value: Date) => {
          return value >= weekStart && value <= weekEnd;
        });
        break;
      default:
        break;
    }
  };

  const handleBulkDelete = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    // Implement delete logic
    console.log(
      "Deleting:",
      selectedRows.map((row) => row.original.id)
    );
  };

  const handleBulkReschedule = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    // Implement reschedule logic
    console.log(
      "Rescheduling:",
      selectedRows.map((row) => row.original.id)
    );
  };

  return (
    <div className={`relative w-full ${className}`}>
      <TableToolbar
        selectedCount={Object.keys(rowSelection).length}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onDateFilter={() => {}}
        onBulkDelete={handleBulkDelete}
        onBulkReschedule={handleBulkReschedule}
      />

      <div className="rounded-md border border-gray-800">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onMouseEnter={(e) => {
                    setHoverItem({
                      item: row.original,
                      position: { x: e.clientX, y: e.clientY },
                    });
                  }}
                  onMouseLeave={() => setHoverItem(null)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnsWithSelect.length}
                  className="h-24 text-center"
                >
                  No scheduled items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={pageIndex + 1}
        pageSize={pageSize}
        totalItems={items.length}
        onPageChange={(page) => setPageIndex(page - 1)}
        onPageSizeChange={setPageSize}
      />

      {hoverItem && (
        <TweetPreview item={hoverItem.item} position={hoverItem.position} />
      )}
    </div>
  );
}
