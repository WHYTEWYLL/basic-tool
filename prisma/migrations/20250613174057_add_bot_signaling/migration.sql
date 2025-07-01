-- Add Bot Signaling fields to User table
ALTER TABLE "User" ADD COLUMN "botSignalingStatus" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lastBotSignalingCheck" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "botSignalingCheckCount" INTEGER NOT NULL DEFAULT 0;

-- Create BotSignalingLog table
CREATE TABLE "BotSignalingLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalUsers" INTEGER NOT NULL,
    "checkedUsers" INTEGER NOT NULL,
    "flaggedUsers" INTEGER NOT NULL,
    "failedChecks" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "context" "UserContext",
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotSignalingLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "BotSignalingLog_runAt_idx" ON "BotSignalingLog"("runAt");
CREATE INDEX "BotSignalingLog_context_idx" ON "BotSignalingLog"("context");