const GITHUB_API = "https://api.github.com";

export async function getGitHubRepos(accessToken: string) {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${GITHUB_API}/user/repos?per_page=100&page=${page}&sort=updated`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" } }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const batch: GitHubRepo[] = await res.json();
    if (batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return repos;
}

export async function registerWebhook(accessToken: string, fullName: string) {
  const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/github`;

  const res = await fetch(`${GITHUB_API}/repos/${fullName}/hooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "web",
      active: true,
      events: ["push", "pull_request"],
      config: {
        url: webhookUrl,
        content_type: "json",
        secret: process.env.GITHUB_WEBHOOK_SECRET,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    // Ignore "already exists" error
    if (err.errors?.[0]?.message?.includes("already exists")) return;
    throw new Error(`Webhook registration failed: ${JSON.stringify(err)}`);
  }
}

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  updated_at: string;
  description: string | null;
  language: string | null;
};
