import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { type Event } from "@/api/events";
import { type SKU } from "@/api/skus";

type EventsChartProps = {
  events: Event[];
  skuMap: Map<string, SKU>;
};

type Bucket = {
  timestamp: number;
  label: string;
  totalPrice: number;
};

function bucketEvents(
  events: Event[],
  skuMap: Map<string, SKU>,
): Bucket[] {
  const buckets = new Map<number, number>();

  for (const event of events) {
    const date = new Date(event.SentAt);
    // Round down to the hour
    const hour = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
    ).getTime();

    const pricePerUnit = skuMap.get(event.SkuID)?.PricePerUnit ?? 0;
    const totalPrice = event.Amount * pricePerUnit;

    buckets.set(hour, (buckets.get(hour) ?? 0) + totalPrice);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([timestamp, totalPrice]) => ({
      timestamp,
      label: new Date(timestamp).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      totalPrice: Math.round(totalPrice * 100) / 100,
    }));
}

export function EventsChart({ events, skuMap }: EventsChartProps) {
  const data = useMemo(
    () => bucketEvents(events, skuMap),
    [events, skuMap],
  );

  if (data.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-medium text-gray-700">
        Total price per hour
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} width={60} />
          <Tooltip
            formatter={(value) => [`${value}`, "Total price"]}
          />
          <Bar dataKey="totalPrice" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
