/*
  Warnings:

  - You are about to drop the column `calories` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `co2Impact` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `itemType` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `mealType` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `nutriScore` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `nutritionValues` on the `Submission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "calories",
DROP COLUMN "co2Impact",
DROP COLUMN "itemType",
DROP COLUMN "mealType",
DROP COLUMN "nutriScore",
DROP COLUMN "nutritionValues";

-- CreateTable
CREATE TABLE "BiteGramSubmission" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "nutriScore" INTEGER NOT NULL,
    "nutritionValues" JSONB NOT NULL,
    "impactLightbulbs" INTEGER NOT NULL,
    "impactShowers" INTEGER NOT NULL,
    "impactGas" INTEGER NOT NULL,
    "impactCo2" INTEGER NOT NULL,

    CONSTRAINT "BiteGramSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrashDashSubmission" (
    "id" UUID NOT NULL,
    "itemType" TEXT NOT NULL,
    "impactTurtles" INTEGER NOT NULL,
    "impactTrashKg" INTEGER NOT NULL,
    "impactTvHours" INTEGER NOT NULL,
    "impactCo2" INTEGER NOT NULL,

    CONSTRAINT "TrashDashSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BiteGramSubmission" ADD CONSTRAINT "BiteGramSubmission_id_fkey" FOREIGN KEY ("id") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrashDashSubmission" ADD CONSTRAINT "TrashDashSubmission_id_fkey" FOREIGN KEY ("id") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
