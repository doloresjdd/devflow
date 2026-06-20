import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { eventQueue } from "@/lib/queue";

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
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
  if (!repo) return NextResponse.json({ ok: true }); // repo not tracked

  const actor = payload.sender?.login ?? "unknown";

  if (event === "pull_request") {
    const action = payload.action;
    if (action === "opened") {
      await eventQueue.add("event", {
        repoId: repo.id,
        type: "pr_opened",
        actor,
        payload: { number: payload.pull_request.number, title: payload.pull_request.title },
        occurredAt: payload.pull_request.created_at,
      });
    } else if (action === "closed" && payload.pull_request.merged) {
      await eventQueue.add("event", {
        repoId: repo.id,
        type: "pr_merged",
        actor,
        payload: { number: payload.pull_request.number, title: payload.pull_request.title },
        occurredAt: payload.pull_request.merged_at,
      });
    }
  } else if (event === "push") {
    await eventQueue.add("event", {
      repoId: repo.id,
      type: "push",
      actor,
      payload: { ref: payload.ref, commits: payload.commits?.length ?? 0 },
      occurredAt: payload.head_commit?.timestamp ?? new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
