import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiKeysApi, type CreateAPIKeyResponse } from "@/api/apiKeys";
import { useListAPIKeys } from "@/queries/useListAPIKeys";

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

      <form onSubmit={handleCreate} className="flex flex-row items-end gap-3 mb-6">
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
        <p className="text-red-600">
          Failed to load API keys: {error.message}
        </p>
      )}
      {keys && keys.length === 0 && (
        <p className="text-gray-500">No API keys yet.</p>
      )}
      {keys && keys.length > 0 && (
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Key</th>
              <th className="py-2 pr-4 font-medium">Created</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.ID} className="border-b border-gray-100">
                <td className="py-2 pr-4">{key.Name}</td>
                <td className="py-2 pr-4 font-mono text-xs">
                  {key.KeyPrefix}...
                </td>
                <td className="py-2 pr-4">
                  {new Date(key.CreatedAt).toLocaleDateString()}
                </td>
                <td className="py-2 pr-4">
                  {key.RevokedAt ? (
                    <span className="text-red-600">Revoked</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )}
                </td>
                <td className="py-2">
                  {!key.RevokedAt && (
                    <button
                      onClick={() => handleRevoke(key.ID)}
                      disabled={revokingID === key.ID}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      {revokingID === key.ID ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
