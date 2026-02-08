import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { eventsApi, type Event } from "@/api/events";
import { skusApi, type SKU } from "@/api/skus";
import { useListEvents } from "@/queries/useListEvents";
import { useListSKUs } from "@/queries/useListSKUs";
import { DataTable } from "@/components/DataTable";
import { formatDate } from "@/lib/formatDate";

type EventRow = {
  event: Event;
  sku: SKU | undefined;
};

const columns: ColumnDef<EventRow, unknown>[] = [
  {
    accessorFn: (row) => row.event.CustomerID,
    header: "Customer",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue<string>()}</span>
    ),
  },
  {
    accessorFn: (row) => row.sku?.Name ?? row.event.SkuID,
    header: "SKU",
  },
  {
    accessorFn: (row) => row.event.Amount,
    header: "Amount",
    cell: ({ row }) => {
      const unit = row.original.sku?.Unit;
      return unit
        ? `${row.original.event.Amount} ${unit}`
        : row.original.event.Amount;
    },
  },
  {
    accessorFn: (row) => {
      const pricePerUnit = row.sku?.PricePerUnit ?? 0;
      return (
        Math.round(row.event.Amount * pricePerUnit * 1_000_000) / 1_000_000
      );
    },
    header: "Total price",
  },
  {
    id: "sentAt",
    accessorFn: (row) => row.event.SentAt,
    header: "Sent At",
    cell: (info) => formatDate(info.getValue<string>()),
  },
];

export function EventsPage() {
  const {
    data: events,
    isPending: eventsPending,
    error: eventsError,
  } = useListEvents();
  const { data: skuList, isPending: skusPending } = useListSKUs();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const skuMap = useMemo(() => {
    const map = new Map<string, SKU>();
    for (const sku of skuList ?? []) {
      map.set(sku.ID, sku);
    }
    return map;
  }, [skuList]);

  const rows: EventRow[] | undefined = useMemo(() => {
    if (!events) return undefined;
    return events.map((event) => ({
      event,
      sku: skuMap.get(event.SkuID),
    }));
  }, [events, skuMap]);

  async function generateDummyEvents() {
    setIsGenerating(true);
    try {
      const skus = await skusApi.list();
      const activeSkus = skus.filter((s) => !s.RevokedAt);
      if (activeSkus.length === 0) {
        alert("Create at least one SKU before generating events.");
        return;
      }

      const customers = Array.from({ length: 5 }, () => crypto.randomUUID());

      for (let i = 0; i < 20; i++) {
        await eventsApi.postEvent({
          customer_id: customers[Math.floor(Math.random() * customers.length)],
          sku_id: activeSkus[Math.floor(Math.random() * activeSkus.length)].ID,
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

  const isPending = eventsPending || skusPending;

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

      {eventsError && (
        <p className="text-red-600">
          Failed to load events: {eventsError.message}
        </p>
      )}

      {rows && rows.length === 0 && (
        <p className="text-gray-500">No events yet.</p>
      )}

      {rows && rows.length > 0 && (
        <DataTable
          data={rows}
          columns={columns}
          initialSorting={[{ id: "sentAt", desc: true }]}
          rowClassName={(row) =>
            row.sku?.RevokedAt ? "text-red-600" : undefined
          }
          rowTitle={(row) =>
            row.sku?.RevokedAt ? "Event received but SKU is revoked" : undefined
          }
        />
      )}
    </div>
  );
}
