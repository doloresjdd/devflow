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

  let totalPRsMerged = 0;
  let totalCommits = 0;
  let cycleTimeSum = 0;
  let cycleTimeCount = 0;
  for (const m of metrics) {
    totalPRsMerged += m.prMerged;
    totalCommits += m.commits;
    if (m.avgCycleTimeMinutes) {
      cycleTimeSum += m.avgCycleTimeMinutes;
      cycleTimeCount++;
    }
  }

  const result = {
    metrics,
    summary: {
      totalPRsMerged,
      totalCommits,
      avgCycleTimeMinutes: cycleTimeCount > 0 ? Math.round(cycleTimeSum / cycleTimeCount) : 0,
      deployFrequency: (totalPRsMerged / days).toFixed(2),
    },
  };

  await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min cache

  return NextResponse.json(result);
}
