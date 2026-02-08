import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "@/api/events";
import { useAuth } from "@/components/AuthProvider";
import { useListEvents } from "@/queries/useListEvents";

export function HomePage() {
  const { merchantID } = useAuth();
  const { data: events, isPending, error } = useListEvents();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateDummyEvents() {
    if (!merchantID) return;
    setIsGenerating(true);
    try {
      const customers = Array.from({ length: 5 }, () => crypto.randomUUID());
      const skus = Array.from({ length: 4 }, () => crypto.randomUUID());

      for (let i = 0; i < 20; i++) {
        await eventsApi.postEvent({
          merchant_id: merchantID,
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
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-2 pr-4 font-medium">Merchant</th>
              <th className="py-2 pr-4 font-medium">Customer</th>
              <th className="py-2 pr-4 font-medium">SKU</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 font-medium">Sent At</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.ID} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-mono text-xs">
                  {event.MerchantID}
                </td>
                <td className="py-2 pr-4 font-mono text-xs">
                  {event.CustomerID}
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{event.SkuID}</td>
                <td className="py-2 pr-4">{event.Amount}</td>
                <td className="py-2">
                  {new Date(event.SentAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
