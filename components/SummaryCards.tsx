type Trends = {
  commits: number | null;
  prsMerged: number | null;
  deployFrequency: number | null;
};

type Summary = {
  totalPRsMerged: number;
  totalCommits: number;
  avgCycleTimeMinutes: number;
  deployFrequency: string;
  trends?: Trends;
};

function formatCycleTime(minutes: number): string {
  if (minutes === 0) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function TrendBadge({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  return (
    <span className={`text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? "▲" : "▼"} {Math.abs(value)}%
    </span>
  );
}

export function SummaryCards({ summary, repoName, lastUpdated }: { summary: Summary; repoName?: string; lastUpdated?: string }) {
  const cards = [
    { label: "PRs Merged", value: summary.totalPRsMerged, sub: "total", trend: summary.trends?.prsMerged },
    { label: "Commits", value: summary.totalCommits, sub: "total", trend: summary.trends?.commits },
    { label: "Avg Cycle Time", value: formatCycleTime(summary.avgCycleTimeMinutes), sub: "PR open → merge", trend: undefined },
    { label: "Deploy Frequency", value: summary.deployFrequency, sub: "merges / day", trend: summary.trends?.deployFrequency },
  ];

  return (
    <div className="space-y-3">
      {repoName && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            <span className="text-white font-medium">{repoName}</span>
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Last updated {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-400">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">{c.sub}</p>
              <TrendBadge value={c.trend} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
