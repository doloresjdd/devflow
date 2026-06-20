import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registerWebhook } from "@/lib/github";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repos = await prisma.repo.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(repos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { githubId, name, fullName } = await req.json();

  // Get access token from DB
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });
  if (!account?.access_token) {
    return NextResponse.json({ error: "No GitHub token" }, { status: 400 });
  }

  // Register webhook on GitHub
  await registerWebhook(account.access_token, fullName);

  const repo = await prisma.repo.upsert({
    where: { githubId },
    create: { githubId, name, fullName, userId: session.user.id },
    update: {},
  });

  return NextResponse.json(repo);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { repoId } = await req.json();

  await prisma.repo.deleteMany({
    where: { id: repoId, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
