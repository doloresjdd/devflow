import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get("repoId");
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");

  if (!repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });

  const cacheKey = `contributors:${repoId}:${days}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  const since = new Date();
  since.setDate(since.getDate() - days);

  const events = await prisma.githubEvent.findMany({
    where: { repoId, occurredAt: { gte: since } },
    select: { actor: true, type: true },
  });

  const map: Record<string, { commits: number; prsOpened: number; prsMerged: number }> = {};
  for (const e of events) {
    if (!map[e.actor]) map[e.actor] = { commits: 0, prsOpened: 0, prsMerged: 0 };
    if (e.type === "push") map[e.actor].commits++;
    if (e.type === "pr_opened") map[e.actor].prsOpened++;
    if (e.type === "pr_merged") map[e.actor].prsMerged++;
  }

  const contributors = Object.entries(map)
    .map(([actor, stats]) => ({ actor, ...stats }))
    .sort((a, b) => b.commits + b.prsMerged - (a.commits + a.prsMerged));

  await redis.setex(cacheKey, 300, JSON.stringify(contributors));
  return NextResponse.json(contributors);
}
