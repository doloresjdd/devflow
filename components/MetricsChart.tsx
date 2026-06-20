"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DailyMetric = {
  date: string;
  prMerged: number;
  prOpened: number;
  commits: number;
  avgCycleTimeMinutes: number | null;
};

export function MetricsChart({ metrics }: { metrics: DailyMetric[] }) {
  const data = metrics.map((m) => ({
    date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    "PRs Merged": m.prMerged,
    "PRs Opened": m.prOpened,
    Commits: m.commits,
    "Cycle Time (h)": m.avgCycleTimeMinutes ? Math.round(m.avgCycleTimeMinutes / 60) : null,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-medium text-gray-400 mb-4">PR Activity</h2>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}
              labelStyle={{ color: "#f9fafb" }}
            />
            <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
            <Bar dataKey="PRs Merged" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="PRs Opened" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="Cycle Time (h)" stroke="#f59e0b" dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-medium text-gray-400 mb-4">Commit Frequency</h2>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}
              labelStyle={{ color: "#f9fafb" }}
            />
            <Bar dataKey="Commits" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
