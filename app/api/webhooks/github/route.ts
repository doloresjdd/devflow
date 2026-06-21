import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function recomputeDailyMetrics(repoId: string, date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [prMerged, prOpened, commits] = await Promise.all([
    prisma.githubEvent.count({ where: { repoId, type: "pr_merged", occurredAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.githubEvent.count({ where: { repoId, type: "pr_opened", occurredAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.githubEvent.count({ where: { repoId, type: "push", occurredAt: { gte: dayStart, lte: dayEnd } } }),
  ]);

  await prisma.dailyMetric.upsert({
    where: { repoId_date: { repoId, date: dayStart } },
    create: { repoId, date: dayStart, prMerged, prOpened, commits },
    update: { prMerged, prOpened, commits },
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  const payload = JSON.parse(rawBody);
  const repoGithubId = payload.repository?.id;

  const repo = await prisma.repo.findUnique({ where: { githubId: repoGithubId } });
  if (!repo) return NextResponse.json({ ok: true });

  const actor = payload.sender?.login ?? "unknown";
  let occurredAt = new Date();
  let type = "";

  if (event === "pull_request") {
    const action = payload.action;
    if (action === "opened") {
      type = "pr_opened";
      occurredAt = new Date(payload.pull_request.created_at);
      await prisma.githubEvent.create({
        data: { repoId: repo.id, type, actor, occurredAt, payload: { number: payload.pull_request.number, title: payload.pull_request.title } },
      });
    } else if (action === "closed" && payload.pull_request.merged) {
      type = "pr_merged";
      occurredAt = new Date(payload.pull_request.merged_at);
      await prisma.githubEvent.create({
        data: { repoId: repo.id, type, actor, occurredAt, payload: { number: payload.pull_request.number, title: payload.pull_request.title } },
      });
    }
  } else if (event === "push") {
    type = "push";
    occurredAt = new Date(payload.head_commit?.timestamp ?? new Date().toISOString());
    await prisma.githubEvent.create({
      data: { repoId: repo.id, type, actor, occurredAt, payload: { ref: payload.ref, commits: payload.commits?.length ?? 0 } },
    });
  }

  if (type) await recomputeDailyMetrics(repo.id, occurredAt);

  return NextResponse.json({ ok: true });
}
