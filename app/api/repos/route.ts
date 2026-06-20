import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// List tracked repos for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repos = await prisma.repo.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(repos);
}

// Add a repo to track
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { githubId, name, fullName } = await req.json();

  const repo = await prisma.repo.upsert({
    where: { githubId },
    create: { githubId, name, fullName, userId: session.user.id },
    update: {},
  });

  return NextResponse.json(repo);
}
