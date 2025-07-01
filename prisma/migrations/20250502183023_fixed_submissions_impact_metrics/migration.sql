/*
  Warnings:

  - You are about to drop the column `impactCarFreeDays` on the `ByeByeBitesSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `impactEnergyOffset` on the `ByeByeBitesSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `impactMealsDonated` on the `ByeByeBitesSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `impactWaterSaved` on the `ByeByeBitesSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `impactTrashKg` on the `TrashDashSubmission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ByeByeBitesSubmission" DROP COLUMN "impactCarFreeDays",
DROP COLUMN "impactEnergyOffset",
DROP COLUMN "impactMealsDonated",
DROP COLUMN "impactWaterSaved",
ADD COLUMN     "impactCarbonSaved" INTEGER,
ADD COLUMN     "impactGasSaved" INTEGER,
ADD COLUMN     "impactPlasticSaved" INTEGER;

-- AlterTable
ALTER TABLE "TrashDashSubmission" DROP COLUMN "impactTrashKg",
ADD COLUMN     "impactGardenFertilized" INTEGER,
ADD COLUMN     "impactTreesSaved" INTEGER;
