import { useCallback, useMemo, useState } from "react";
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
  title: string;
  groupBy: (event: Event) => string;
  labelBy?: (id: string) => string;
};

type Bucket = Record<string, string | number> & {
  timestamp: number;
  label: string;
};

type BucketData = {
  buckets: Bucket[];
  seriesKeys: string[];
};

const MAX_SERIES = 10;

function bucketEvents(
  events: Event[],
  skuMap: Map<string, SKU>,
  groupBy: (event: Event) => string,
): BucketData {
  // Map<hour, Map<groupKey, totalPrice>>
  const buckets = new Map<number, Map<string, number>>();
  const groupKeySet = new Set<string>();

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

    const key = groupBy(event);
    groupKeySet.add(key);

    if (!buckets.has(hour)) buckets.set(hour, new Map());
    const hourBucket = buckets.get(hour)!;
    hourBucket.set(key, (hourBucket.get(key) ?? 0) + totalPrice);
  }

  // Compute total price per group across all hours
  const totalByGroup = new Map<string, number>();
  for (const groupTotals of buckets.values()) {
    for (const [id, val] of groupTotals) {
      totalByGroup.set(id, (totalByGroup.get(id) ?? 0) + val);
    }
  }

  // Keep top N groups by total, rest goes into "Others"
  const sorted = Array.from(totalByGroup.entries()).sort(
    ([, a], [, b]) => b - a,
  );
  const topKeys = sorted.slice(0, MAX_SERIES).map(([id]) => id);
  const othersKeys = sorted.slice(MAX_SERIES).map(([id]) => id);
  const seriesKeys =
    othersKeys.length > 0 ? [...topKeys, "Others"] : topKeys;

  const sortedBuckets = Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([timestamp, groupTotals]) => {
      const bucket: Bucket = {
        timestamp,
        label: new Date(timestamp).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      for (const key of topKeys) {
        const val = groupTotals.get(key) ?? 0;
        bucket[key] = Math.round(val * 100) / 100;
      }
      if (othersKeys.length > 0) {
        let othersTotal = 0;
        for (const key of othersKeys) {
          othersTotal += groupTotals.get(key) ?? 0;
        }
        bucket["Others"] = Math.round(othersTotal * 100) / 100;
      }
      return bucket;
    });

  return { buckets: sortedBuckets, seriesKeys };
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

type CustomLegendProps = {
  payload?: Array<{ value: string; color: string; dataKey: string }>;
  hiddenKeys: Set<string>;
  onToggle: (key: string) => void;
  onSolo: (key: string) => void;
};

function CustomLegend({
  payload,
  hiddenKeys,
  onToggle,
  onSolo,
}: CustomLegendProps) {
  if (!payload) return null;

  return (
    <div className="flex flex-row flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
      {payload.map((entry) => {
        const hidden = hiddenKeys.has(entry.dataKey);
        return (
          <div
            key={entry.dataKey}
            className="flex flex-row items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => onToggle(entry.dataKey)}
              className="group relative flex h-3 w-3 shrink-0 items-center justify-center rounded-sm"
              style={{ backgroundColor: hidden ? "#d1d5db" : entry.color }}
              title={hidden ? "Show" : "Hide"}
            >
              <svg
                viewBox="0 0 8 8"
                className="h-2 w-2 text-white opacity-0 group-hover:opacity-100"
              >
                <path
                  d="M1 1L7 7M7 1L1 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onSolo(entry.dataKey)}
              className="text-xs hover:underline"
              style={{ color: hidden ? "#9ca3af" : "#374151" }}
              title="Show only this"
            >
              {entry.value}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function EventsChart({
  events,
  skuMap,
  title,
  groupBy,
  labelBy,
}: EventsChartProps) {
  const { buckets, seriesKeys } = useMemo(
    () => bucketEvents(events, skuMap, groupBy),
    [events, skuMap, groupBy],
  );

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const toggleKey = useCallback((key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const soloKey = useCallback(
    (key: string) => {
      setHiddenKeys((prev) => {
        const allHiddenExceptThis =
          prev.size === seriesKeys.length - 1 && !prev.has(key);
        if (allHiddenExceptThis) {
          // Already solo — restore all
          return new Set();
        }
        return new Set(seriesKeys.filter((k) => k !== key));
      });
    },
    [seriesKeys],
  );

  if (buckets.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-medium text-gray-700">{title}</h2>
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
          <Legend
            content={
              <CustomLegend
                hiddenKeys={hiddenKeys}
                onToggle={toggleKey}
                onSolo={soloKey}
              />
            }
          />
          {seriesKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              name={key === "Others" ? "Others" : (labelBy?.(key) ?? key)}
              stackId="a"
              fill={key === "Others" ? "#9ca3af" : COLORS[i % COLORS.length]}
              hide={hiddenKeys.has(key)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
