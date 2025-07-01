-- CreateEnum
CREATE TYPE "UserContext" AS ENUM ('B3TRBUDDY', 'BYEBYEBITES', 'BITEGRAM', 'TRASHDASH');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "Network" AS ENUM ('ETHEREUM', 'VECHAIN');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "vechainAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "context" "UserContext" NOT NULL DEFAULT 'B3TRBUDDY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "network" "Network" NOT NULL,
    "coingeckoId" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAsset" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "totalAmountUsd" DECIMAL(36,18),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapStep" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "fromAssetId" UUID NOT NULL,
    "toAssetId" UUID NOT NULL,
    "fromAmount" DECIMAL(36,18) NOT NULL,
    "toAmount" DECIMAL(36,18) NOT NULL,
    "fromNetwork" "Network" NOT NULL,
    "toNetwork" "Network" NOT NULL,
    "exchangeRate" DECIMAL(36,18) NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SwapStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "context" "UserContext" NOT NULL DEFAULT 'B3TRBUDDY',
    "status" "SubmissionStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "b3trAmount" INTEGER,
    "mealType" TEXT,
    "nutriScore" INTEGER,
    "calories" INTEGER,
    "co2Impact" INTEGER,
    "nutritionValues" JSONB,
    "itemType" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_context_key" ON "User"("walletAddress", "context");

-- CreateIndex
CREATE UNIQUE INDEX "User_vechainAddress_context_key" ON "User"("vechainAddress", "context");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_context_key" ON "User"("email", "context");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_symbol_network_key" ON "Asset"("symbol", "network");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_contractAddress_network_key" ON "Asset"("contractAddress", "network");

-- CreateIndex
CREATE UNIQUE INDEX "UserAsset_userId_assetId_key" ON "UserAsset"("userId", "assetId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SwapStep_transactionId_stepNumber_key" ON "SwapStep"("transactionId", "stepNumber");

-- CreateIndex
CREATE INDEX "Submission_context_idx" ON "Submission"("context");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- AddForeignKey
ALTER TABLE "UserAsset" ADD CONSTRAINT "UserAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAsset" ADD CONSTRAINT "UserAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapStep" ADD CONSTRAINT "SwapStep_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapStep" ADD CONSTRAINT "SwapStep_fromAssetId_fkey" FOREIGN KEY ("fromAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapStep" ADD CONSTRAINT "SwapStep_toAssetId_fkey" FOREIGN KEY ("toAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
