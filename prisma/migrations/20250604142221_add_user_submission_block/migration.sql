-- CreateTable
CREATE TABLE "UserSubmissionBlock" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "context" "UserContext" NOT NULL,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubmissionBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSubmissionBlock_userId_context_key" ON "UserSubmissionBlock"("userId", "context");

-- AddForeignKey
ALTER TABLE "UserSubmissionBlock" ADD CONSTRAINT "UserSubmissionBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 