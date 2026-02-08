import { useListEvents } from "@/queries/useListEvents";

export function HomePage() {
  const { data: events, isPending, error } = useListEvents();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Events</h1>

      {isPending && <p className="text-gray-500">Loading events...</p>}

      {error && (
        <p className="text-red-600">
          Failed to load events: {error.message}
        </p>
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
                <td className="py-2 pr-4 font-mono text-xs">{event.MerchantID}</td>
                <td className="py-2 pr-4 font-mono text-xs">{event.CustomerID}</td>
                <td className="py-2 pr-4 font-mono text-xs">{event.SkuID}</td>
                <td className="py-2 pr-4">{event.Amount}</td>
                <td className="py-2">{new Date(event.SentAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
