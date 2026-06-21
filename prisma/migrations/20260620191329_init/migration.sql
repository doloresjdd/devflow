-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "email" TEXT,
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "access_token" TEXT,
    "token_type" TEXT,
    "scope" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repo" (
    "id" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubEvent" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "actor" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "prMerged" INTEGER NOT NULL DEFAULT 0,
    "prOpened" INTEGER NOT NULL DEFAULT 0,
    "avgCycleTimeMinutes" INTEGER,
    "deployFrequency" DOUBLE PRECISION,
    "commits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Repo_githubId_key" ON "Repo"("githubId");

-- CreateIndex
CREATE INDEX "GithubEvent_repoId_type_occurredAt_idx" ON "GithubEvent"("repoId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "DailyMetric_repoId_date_idx" ON "DailyMetric"("repoId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_repoId_date_key" ON "DailyMetric"("repoId", "date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repo" ADD CONSTRAINT "Repo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubEvent" ADD CONSTRAINT "GithubEvent_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMetric" ADD CONSTRAINT "DailyMetric_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
