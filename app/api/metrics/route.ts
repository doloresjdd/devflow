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
  const prevSince = new Date();
  prevSince.setDate(prevSince.getDate() - days * 2);

  const [metrics, prevMetrics] = await Promise.all([
    prisma.dailyMetric.findMany({ where: { repoId, date: { gte: since } }, orderBy: { date: "asc" } }),
    prisma.dailyMetric.findMany({ where: { repoId, date: { gte: prevSince, lt: since } }, orderBy: { date: "asc" } }),
  ]);

  const repo = await prisma.repo.findUnique({ where: { id: repoId }, select: { fullName: true, createdAt: true } });

  function summarize(data: typeof metrics) {
    let totalPRsMerged = 0, totalCommits = 0, cycleTimeSum = 0, cycleTimeCount = 0;
    for (const m of data) {
      totalPRsMerged += m.prMerged;
      totalCommits += m.commits;
      if (m.avgCycleTimeMinutes) { cycleTimeSum += m.avgCycleTimeMinutes; cycleTimeCount++; }
    }
    return {
      totalPRsMerged,
      totalCommits,
      avgCycleTimeMinutes: cycleTimeCount > 0 ? Math.round(cycleTimeSum / cycleTimeCount) : 0,
      deployFrequency: (totalPRsMerged / days).toFixed(2),
    };
  }

  const summary = summarize(metrics);
  const prevSummary = summarize(prevMetrics);

  function trend(curr: number, prev: number) {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  }

  const result = {
    metrics,
    repo,
    summary: {
      ...summary,
      trends: {
        commits: trend(summary.totalCommits, prevSummary.totalCommits),
        prsMerged: trend(summary.totalPRsMerged, prevSummary.totalPRsMerged),
        deployFrequency: trend(parseFloat(summary.deployFrequency), parseFloat(prevSummary.deployFrequency)),
      },
    },
  };

  await redis.setex(cacheKey, 300, JSON.stringify(result));
  return NextResponse.json(result);
}
