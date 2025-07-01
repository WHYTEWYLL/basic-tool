-- CreateTable
CREATE TABLE "AiRequestLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "context" "UserContext" NOT NULL,
    "userId" UUID,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequestLog_pkey" PRIMARY KEY ("id")
); 