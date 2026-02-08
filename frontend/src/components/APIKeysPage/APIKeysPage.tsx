import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import {
  apiKeysApi,
  type APIKey,
  type CreateAPIKeyResponse,
} from "@/api/apiKeys";
import { useListAPIKeys } from "@/queries/useListAPIKeys";
import { DataTable } from "@/components/DataTable";

export function APIKeysPage() {
  const { data: keys, isPending, error } = useListAPIKeys();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateAPIKeyResponse | null>(
    null,
  );
  const [revokingID, setRevokingID] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const result = await apiKeysApi.create({ name: name.trim() });
      setCreatedKey(result);
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevokingID(id);
    try {
      await apiKeysApi.revoke(id);
      await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    } finally {
      setRevokingID(null);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">API Keys</h1>

      <form
        onSubmit={handleCreate}
        className="flex flex-row items-end gap-3 mb-6"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Key name</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Production"
          />
        </label>
        <button
          type="submit"
          disabled={isCreating}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create key"}
        </button>
      </form>

      {createdKey && (
        <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200">
          <p className="text-sm font-medium text-green-800 mb-2">
            API key created. Copy it now — you won't be able to see it again.
          </p>
          <code className="block text-sm font-mono bg-white px-3 py-2 rounded border border-green-200 select-all">
            {createdKey.key}
          </code>
          <button
            onClick={() => setCreatedKey(null)}
            className="mt-2 text-sm text-green-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {isPending && <p className="text-gray-500">Loading API keys...</p>}
      {error && (
        <p className="text-red-600">Failed to load API keys: {error.message}</p>
      )}
      {keys && keys.length === 0 && (
        <p className="text-gray-500">No API keys yet.</p>
      )}
      {keys && keys.length > 0 && (
        <DataTable
          data={keys}
          columns={
            [
              {
                accessorKey: "Name",
                header: "Name",
              },
              {
                accessorKey: "KeyPrefix",
                header: "Key",
                cell: (info) => (
                  <span className="font-mono text-xs">
                    {info.getValue<string>()}...
                  </span>
                ),
              },
              {
                accessorKey: "CreatedAt",
                header: "Created",
                cell: (info) =>
                  new Date(info.getValue<string>()).toLocaleString(),
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
            ] satisfies ColumnDef<APIKey, unknown>[]
          }
        />
      )}
    </div>
  );
}
