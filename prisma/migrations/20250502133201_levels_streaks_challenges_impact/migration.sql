-- CreateEnum
CREATE TYPE "RewardConfigType" AS ENUM ('BASE_REWARD', 'LEVEL_REWARDS', 'STREAK_BONUSES', 'EXPIRY_MULTIPLIERS', 'SUSTAINABILITY_METRICS', 'CHALLENGES');

-- CreateEnum
CREATE TYPE "StreakCountType" AS ENUM ('DAYS', 'WEEKS');

-- CreateTable
CREATE TABLE "RewardConfig" (
    "id" UUID NOT NULL,
    "context" "UserContext" NOT NULL,
    "type" "RewardConfigType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallengeProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "context" "UserContext" NOT NULL,
    "challengeType" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "progressCount" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserChallengeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLevelProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "context" "UserContext" NOT NULL,
    "currentLevel" INTEGER NOT NULL,
    "totalSubmissions" INTEGER NOT NULL,
    "achievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLevelProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStreakProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "context" "UserContext" NOT NULL,
    "streakCount" INTEGER NOT NULL,
    "lastSubmissionAt" TIMESTAMP(3) NOT NULL,
    "streakCountType" "StreakCountType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStreakProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserImpactSummary" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "context" "UserContext" NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserImpactSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RewardConfig_context_type_key" ON "RewardConfig"("context", "type");

-- CreateIndex
CREATE INDEX "UserChallengeProgress_userId_context_idx" ON "UserChallengeProgress"("userId", "context");

-- CreateIndex
CREATE UNIQUE INDEX "UserLevelProgress_userId_context_key" ON "UserLevelProgress"("userId", "context");

-- CreateIndex
CREATE UNIQUE INDEX "UserStreakProgress_userId_context_key" ON "UserStreakProgress"("userId", "context");

-- CreateIndex
CREATE UNIQUE INDEX "UserImpactSummary_userId_context_key" ON "UserImpactSummary"("userId", "context");

-- AddForeignKey
ALTER TABLE "UserChallengeProgress" ADD CONSTRAINT "UserChallengeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLevelProgress" ADD CONSTRAINT "UserLevelProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStreakProgress" ADD CONSTRAINT "UserStreakProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserImpactSummary" ADD CONSTRAINT "UserImpactSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
