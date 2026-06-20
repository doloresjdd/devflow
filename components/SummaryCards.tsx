type Summary = {
  totalPRsMerged: number;
  totalCommits: number;
  avgCycleTimeMinutes: number;
  deployFrequency: string;
};

function formatCycleTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function SummaryCards({ summary }: { summary: Summary }) {
  const cards = [
    { label: "PRs Merged", value: summary.totalPRsMerged, sub: "total" },
    { label: "Commits", value: summary.totalCommits, sub: "total" },
    {
      label: "Avg Cycle Time",
      value: formatCycleTime(summary.avgCycleTimeMinutes),
      sub: "PR open → merge",
    },
    {
      label: "Deploy Frequency",
      value: summary.deployFrequency,
      sub: "merges / day",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">{c.label}</p>
          <p className="text-3xl font-bold mt-1">{c.value}</p>
          <p className="text-xs text-gray-500 mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
