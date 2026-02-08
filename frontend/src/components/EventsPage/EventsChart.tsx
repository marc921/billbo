import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { type Event } from "@/api/events";
import { type SKU } from "@/api/skus";

type EventsChartProps = {
  events: Event[];
  skuMap: Map<string, SKU>;
};

type Bucket = Record<string, string | number> & {
  timestamp: number;
  label: string;
};

type BucketData = {
  buckets: Bucket[];
  customerIDs: string[];
};

function bucketEvents(events: Event[], skuMap: Map<string, SKU>): BucketData {
  // Map<hour, Map<customerID, totalPrice>>
  const buckets = new Map<number, Map<string, number>>();
  const customerIDSet = new Set<string>();

  for (const event of events) {
    const date = new Date(event.SentAt);
    const hour = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
    ).getTime();

    const pricePerUnit = skuMap.get(event.SkuID)?.PricePerUnit ?? 0;
    const totalPrice = event.Amount * pricePerUnit;

    customerIDSet.add(event.CustomerID);

    if (!buckets.has(hour)) buckets.set(hour, new Map());
    const hourBucket = buckets.get(hour)!;
    hourBucket.set(
      event.CustomerID,
      (hourBucket.get(event.CustomerID) ?? 0) + totalPrice,
    );
  }

  // Compute total price per customer across all hours
  const totalByCustomer = new Map<string, number>();
  for (const customerTotals of buckets.values()) {
    for (const [id, val] of customerTotals) {
      totalByCustomer.set(id, (totalByCustomer.get(id) ?? 0) + val);
    }
  }

  // Keep top 10 customers by total, rest goes into "Others"
  const MAX_CUSTOMERS = 10;
  const sorted = Array.from(totalByCustomer.entries()).sort(
    ([, a], [, b]) => b - a,
  );
  const topIDs = sorted.slice(0, MAX_CUSTOMERS).map(([id]) => id);
  const othersIDs = sorted.slice(MAX_CUSTOMERS).map(([id]) => id);
  const customerIDs =
    othersIDs.length > 0 ? [...topIDs, "Others"] : topIDs;

  const sortedBuckets = Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([timestamp, customerTotals]) => {
      const bucket: Bucket = {
        timestamp,
        label: new Date(timestamp).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      for (const id of topIDs) {
        const val = customerTotals.get(id) ?? 0;
        bucket[id] = Math.round(val * 100) / 100;
      }
      if (othersIDs.length > 0) {
        let othersTotal = 0;
        for (const id of othersIDs) {
          othersTotal += customerTotals.get(id) ?? 0;
        }
        bucket["Others"] = Math.round(othersTotal * 100) / 100;
      }
      return bucket;
    });

  return { buckets: sortedBuckets, customerIDs };
}

const COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#f59e0b",
  "#7c3aed",
  "#db2777",
  "#06b6d4",
  "#ea580c",
  "#84cc16",
  "#1e3a5f",
];

export function EventsChart({ events, skuMap }: EventsChartProps) {
  const { buckets, customerIDs } = useMemo(
    () => bucketEvents(events, skuMap),
    [events, skuMap],
  );

  if (buckets.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-medium text-gray-700">
        Total price per hour
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={buckets}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} width={60} />
          <Tooltip />
          <Legend />
          {customerIDs.map((id, i) => (
            <Bar
              key={id}
              dataKey={id}
              stackId="a"
              fill={id === "Others" ? "#9ca3af" : COLORS[i % COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
