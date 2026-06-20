import { Queue, Worker, Job } from "bullmq";
import { redis } from "./redis";
import { prisma } from "./prisma";

export const eventQueue = new Queue("github-events", { connection: redis });

export type EventJob = {
  repoId: string;
  type: string;
  actor: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export function startWorker() {
  return new Worker<EventJob>(
    "github-events",
    async (job: Job<EventJob>) => {
      const { repoId, type, actor, payload, occurredAt } = job.data;

      await prisma.githubEvent.create({
        data: {
          repoId,
          type,
          actor,
          payload,
          occurredAt: new Date(occurredAt),
        },
      });

      await recomputeDailyMetrics(repoId, new Date(occurredAt));
    },
    { connection: redis, concurrency: 5 }
  );
}

async function recomputeDailyMetrics(repoId: string, date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [prMerged, prOpened, commits, cycleTimeResult] = await Promise.all([
    prisma.githubEvent.count({
      where: { repoId, type: "pr_merged", occurredAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.githubEvent.count({
      where: { repoId, type: "pr_opened", occurredAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.githubEvent.count({
      where: { repoId, type: "push", occurredAt: { gte: dayStart, lte: dayEnd } },
    }),
    // Average cycle time: time from pr_opened to pr_merged (in minutes)
    prisma.$queryRaw<{ avg_minutes: number }[]>`
      SELECT AVG(EXTRACT(EPOCH FROM (m.occurred_at - o.occurred_at)) / 60) as avg_minutes
      FROM github_events m
      JOIN github_events o ON o.repo_id = m.repo_id
        AND o.payload->>'number' = m.payload->>'number'
        AND o.type = 'pr_opened'
      WHERE m.repo_id = ${repoId}
        AND m.type = 'pr_merged'
        AND m.occurred_at BETWEEN ${dayStart} AND ${dayEnd}
    `,
  ]);

  await prisma.dailyMetric.upsert({
    where: { repoId_date: { repoId, date: dayStart } },
    create: {
      repoId,
      date: dayStart,
      prMerged,
      prOpened,
      commits,
      avgCycleTimeMinutes: Math.round(cycleTimeResult[0]?.avg_minutes ?? 0),
    },
    update: {
      prMerged,
      prOpened,
      commits,
      avgCycleTimeMinutes: Math.round(cycleTimeResult[0]?.avg_minutes ?? 0),
    },
  });
}
