"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  updated_at: string;
  tracked: boolean;
};

export default function ReposPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/repos/github")
      .then((r) => r.json())
      .then(setRepos)
      .finally(() => setLoading(false));
  }, []);

  async function toggleRepo(repo: GitHubRepo) {
    setPending((p) => new Set(p).add(repo.id));
    try {
      if (repo.tracked) {
        // Find tracked repo id first
        const tracked = await fetch("/api/repos").then((r) => r.json());
        const match = tracked.find((r: { githubId: number; id: string }) => r.githubId === repo.id);
        if (match) {
          await fetch("/api/repos", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repoId: match.id }),
          });
        }
      } else {
        await fetch("/api/repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubId: repo.id, name: repo.name, fullName: repo.full_name }),
        });
      }
      setRepos((prev) =>
        prev.map((r) => (r.id === repo.id ? { ...r, tracked: !r.tracked } : r))
      );
    } finally {
      setPending((p) => { const next = new Set(p); next.delete(repo.id); return next; });
    }
  }

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Repositories</h1>
            <p className="text-gray-400 text-sm mt-1">
              Select repos to track. DevFlow will register webhooks automatically.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        <input
          type="text"
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />

        {loading ? (
          <div className="text-gray-400 text-center py-20">Loading your GitHub repos...</div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((repo) => (
              <li
                key={repo.id}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 hover:border-gray-600 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{repo.full_name}</span>
                    {repo.private && (
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                        Private
                      </span>
                    )}
                    {repo.language && (
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                        {repo.language}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{repo.description}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleRepo(repo)}
                  disabled={pending.has(repo.id)}
                  className={`ml-4 shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    repo.tracked
                      ? "bg-green-900 text-green-300 hover:bg-red-900 hover:text-red-300"
                      : "bg-gray-800 text-gray-300 hover:bg-blue-900 hover:text-blue-300"
                  }`}
                >
                  {pending.has(repo.id) ? "..." : repo.tracked ? "Tracking" : "Track"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
