"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MetricsChart } from "@/components/MetricsChart";
import { SummaryCards } from "@/components/SummaryCards";
import { RepoSelector } from "@/components/RepoSelector";
import { ContributorChart } from "@/components/ContributorChart";

type Repo = { id: string; name: string; fullName: string };
type Summary = {
  totalPRsMerged: number;
  totalCommits: number;
  avgCycleTimeMinutes: number;
  deployFrequency: string;
};
type DailyMetric = {
  date: string;
  prMerged: number;
  prOpened: number;
  commits: number;
  avgCycleTimeMinutes: number | null;
};
type Contributor = {
  actor: string;
  commits: number;
  prsOpened: number;
  prsMerged: number;
};

export default function DashboardPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/repos")
      .then((r) => r.json())
      .then((data) => {
        setRepos(data);
        if (data.length > 0) setSelectedRepo(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedRepo) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/metrics?repoId=${selectedRepo}&days=${days}`).then((r) => r.json()),
      fetch(`/api/contributors?repoId=${selectedRepo}&days=${days}`).then((r) => r.json()),
    ])
      .then(([metricsData, contributorsData]) => {
        setMetrics(metricsData.metrics ?? []);
        setSummary(metricsData.summary ?? null);
        setContributors(contributorsData ?? []);
      })
      .finally(() => setLoading(false));
  }, [selectedRepo, days]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">DevFlow Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/repos")}
              className="text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              Manage Repos
            </button>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <RepoSelector repos={repos} selected={selectedRepo} onSelect={setSelectedRepo} />
          </div>
        </div>

        {summary && <SummaryCards summary={summary} />}

        {loading ? (
          <div className="text-gray-400 text-center py-20">Loading metrics...</div>
        ) : metrics.length === 0 ? (
          <div className="text-gray-500 text-center py-20">
            No data yet. Add a repo and configure the GitHub webhook to start tracking.
          </div>
        ) : (
          <>
            <MetricsChart metrics={metrics} />
            {contributors.length > 0 && <ContributorChart contributors={contributors} />}
          </>
        )}
      </div>
    </div>
  );
}
