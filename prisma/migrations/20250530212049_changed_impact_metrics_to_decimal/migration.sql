/*
  Warnings:

  - Changed the type of `quantity` on the `RecipeIngredient` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "BiteGramSubmission" ALTER COLUMN "impactLightbulbs" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "impactShowers" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "impactGas" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "impactCo2" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ByeByeBitesSubmission" ALTER COLUMN "impactCarbonSaved" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "impactGasSaved" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "impactPlasticSaved" SET DATA TYPE DECIMAL(65,30);

-- Handle NULL values in RecipeIngredient.quantity before changing column type
UPDATE "RecipeIngredient" SET "quantity" = 0 WHERE "quantity" IS NULL;

-- AlterTable
ALTER TABLE "RecipeIngredient" DROP COLUMN "quantity",
ADD COLUMN     "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TrashDashSubmission" ALTER COLUMN "impactTurtles" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "impactTvHours" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "impactCo2" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "impactGardenFertilized" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "impactTreesSaved" SET DATA TYPE DECIMAL(65,30);
