/*
  Warnings:

  - Changed the type of `quantity` on the `RecipeIngredient` table. The data in that column will be cast from `Decimal(65,30)` to `Text`.

*/
-- AlterTable
ALTER TABLE "RecipeIngredient" ALTER COLUMN "quantity" DROP NOT NULL,
ALTER COLUMN "quantity" TYPE TEXT USING "quantity"::TEXT; 