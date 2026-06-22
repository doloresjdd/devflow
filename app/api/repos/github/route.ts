import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getGitHubRepos } from "@/lib/github";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });
  if (!account?.access_token) {
    return NextResponse.json({ error: "No GitHub token" }, { status: 400 });
  }

  const repos = await getGitHubRepos(account.access_token);

  // Mark which ones are already tracked
  const tracked = await prisma.repo.findMany({
    where: { userId: session.user.id },
    select: { githubId: true },
  });
  const trackedIds = new Set(tracked.map((r: { githubId: number }) => r.githubId));

  return NextResponse.json(
    repos.map((r) => ({ ...r, tracked: trackedIds.has(r.id) }))
  );
}
