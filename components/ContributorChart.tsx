"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Contributor = {
  actor: string;
  commits: number;
  prsOpened: number;
  prsMerged: number;
};

export function ContributorChart({ contributors }: { contributors: Contributor[] }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-sm font-medium text-gray-400 mb-4">Contributor Activity</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={contributors} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 12 }} />
          <YAxis dataKey="actor" type="category" tick={{ fill: "#6b7280", fontSize: 12 }} width={80} />
          <Tooltip
            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}
            labelStyle={{ color: "#f9fafb" }}
          />
          <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
          <Bar dataKey="commits" name="Commits" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
          <Bar dataKey="prsMerged" name="PRs Merged" fill="#10b981" radius={[0, 3, 3, 0]} />
          <Bar dataKey="prsOpened" name="PRs Opened" fill="#3b82f6" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
