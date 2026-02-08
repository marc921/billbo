import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { eventsApi, type Event } from "@/api/events";
import { useListEvents } from "@/queries/useListEvents";
import { DataTable } from "@/components/DataTable";

const columns: ColumnDef<Event, unknown>[] = [
  {
    accessorKey: "CustomerID",
    header: "Customer",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "SkuID",
    header: "SKU",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "Amount",
    header: "Amount",
  },
  {
    accessorKey: "SentAt",
    header: "Sent At",
    cell: (info) => new Date(info.getValue<string>()).toLocaleString(),
  },
];

export function EventsPage() {
  const { data: events, isPending, error } = useListEvents();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateDummyEvents() {
    setIsGenerating(true);
    try {
      const customers = Array.from({ length: 5 }, () => crypto.randomUUID());
      const skus = Array.from({ length: 4 }, () => crypto.randomUUID());

      for (let i = 0; i < 20; i++) {
        await eventsApi.postEvent({
          customer_id: customers[Math.floor(Math.random() * customers.length)],
          sku_id: skus[Math.floor(Math.random() * skus.length)],
          amount: Math.round(Math.random() * 10000) / 100,
          sent_at: new Date(
            Date.now() - Math.floor(Math.random() * 72) * 3600000,
          ).toISOString(),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["events"] });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-row items-center gap-4 mb-4">
        <h1 className="text-2xl font-semibold">Events</h1>
        <button
          onClick={generateDummyEvents}
          disabled={isGenerating}
          className="text-sm px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate dummy events"}
        </button>
      </div>

      {isPending && <p className="text-gray-500">Loading events...</p>}

      {error && (
        <p className="text-red-600">Failed to load events: {error.message}</p>
      )}

      {events && events.length === 0 && (
        <p className="text-gray-500">No events yet.</p>
      )}

      {events && events.length > 0 && (
        <DataTable data={events} columns={columns} />
      )}
    </div>
  );
}
