-- CreateEnum
CREATE TYPE "AdminEntity" AS ENUM ('BYEBYEBITES_CONFIG', 'TRASHDASH_CONFIG', 'BITEGRAM_CONFIG');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('READ', 'READ_WRITE');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" UUID NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "nonceExpiresAt" TIMESTAMP(3) NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "entity" "AdminEntity" NOT NULL,
    "role" "AdminRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_walletAddress_key" ON "AdminUser"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_userId_entity_key" ON "AdminPermission"("userId", "entity");

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
