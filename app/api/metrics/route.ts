import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get("repoId");
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");

  if (!repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });

  const cacheKey = `metrics:${repoId}:${days}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  const since = new Date();
  since.setDate(since.getDate() - days);

  const metrics = await prisma.dailyMetric.findMany({
    where: { repoId, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  const result = {
    metrics,
    summary: {
      totalPRsMerged: metrics.reduce((s: number, m) => s + m.prMerged, 0),
      totalCommits: metrics.reduce((s: number, m) => s + m.commits, 0),
      avgCycleTimeMinutes:
        Math.round(
          metrics.filter((m) => m.avgCycleTimeMinutes).reduce((s: number, m) => s + (m.avgCycleTimeMinutes ?? 0), 0) /
            (metrics.filter((m) => m.avgCycleTimeMinutes).length || 1)
        ),
      deployFrequency: (metrics.reduce((s: number, m) => s + m.prMerged, 0) / days).toFixed(2),
    },
  };

  await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min cache

  return NextResponse.json(result);
}
