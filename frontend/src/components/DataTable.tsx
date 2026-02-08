import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, unknown>[];
};

export function DataTable<T>({ data, columns }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Filter..."
        className="w-64 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-gray-200 text-gray-500"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`py-2 pr-4 font-medium ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="flex flex-row items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    {{
                      asc: " \u2191",
                      desc: " \u2193",
                    }[header.column.getIsSorted() as string] ?? null}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="py-2 pr-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
