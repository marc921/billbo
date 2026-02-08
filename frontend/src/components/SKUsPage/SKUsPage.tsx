import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { skusApi, type SKU } from "@/api/skus";
import { useListSKUs } from "@/queries/useListSKUs";
import { DataTable } from "@/components/DataTable";
import { formatDate } from "@/lib/formatDate";

export function SKUsPage() {
  const { data: skuList, isPending, error } = useListSKUs();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [revokingID, setRevokingID] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !pricePerUnit) return;
    setIsCreating(true);
    try {
      await skusApi.create({
        name: name.trim(),
        unit: unit.trim() || undefined,
        price_per_unit: parseFloat(pricePerUnit),
      });
      setName("");
      setUnit("");
      setPricePerUnit("");
      await queryClient.invalidateQueries({ queryKey: ["skus"] });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevokingID(id);
    try {
      await skusApi.revoke(id);
      await queryClient.invalidateQueries({ queryKey: ["skus"] });
    } finally {
      setRevokingID(null);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">SKUs</h1>

      <form
        onSubmit={handleCreate}
        className="flex flex-row items-end gap-3 mb-6"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Claude Opus 4.6 Input Tokens"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Unit</span>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. LLM token"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Price per unit
          </span>
          <input
            type="number"
            required
            min="0"
            step="any"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. 0.00001"
          />
        </label>
        <button
          type="submit"
          disabled={isCreating}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create SKU"}
        </button>
      </form>

      {isPending && <p className="text-gray-500">Loading SKUs...</p>}
      {error && (
        <p className="text-red-600">Failed to load SKUs: {error.message}</p>
      )}
      {skuList && skuList.length === 0 && (
        <p className="text-gray-500">No SKUs yet.</p>
      )}
      {skuList && skuList.length > 0 && (
        <DataTable
          data={skuList}
          columns={
            [
              {
                accessorKey: "Name",
                header: "Name",
              },
              {
                accessorKey: "Unit",
                header: "Unit",
                cell: (info) => info.getValue<string | null>() ?? "—",
              },
              {
                accessorKey: "PricePerUnit",
                header: "Price per unit",
              },
              {
                accessorKey: "CreatedAt",
                header: "Created",
                cell: (info) => formatDate(info.getValue<string>()),
              },
              {
                accessorKey: "RevokedAt",
                header: "Status",
                cell: (info) =>
                  info.getValue<string | null>() ? (
                    <span className="text-red-600">Revoked</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  ),
              },
              {
                id: "actions",
                header: "",
                enableSorting: false,
                enableGlobalFilter: false,
                cell: ({ row }) =>
                  !row.original.RevokedAt && (
                    <button
                      onClick={() => handleRevoke(row.original.ID)}
                      disabled={revokingID === row.original.ID}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      {revokingID === row.original.ID
                        ? "Revoking..."
                        : "Revoke"}
                    </button>
                  ),
              },
            ] satisfies ColumnDef<SKU, unknown>[]
          }
        />
      )}
    </div>
  );
}
