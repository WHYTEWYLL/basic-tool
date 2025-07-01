/*
  Warnings:

  - You are about to drop the column `totalAmountUsd` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `fromAmount` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromAssetId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromNetwork` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toAmount` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toAssetId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toNetwork` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SwapStep" ADD COLUMN     "transactionFees" DECIMAL(36,18);

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "totalAmountUsd",
ADD COLUMN     "fromAmount" DECIMAL(36,18) NOT NULL,
ADD COLUMN     "fromAssetId" UUID NOT NULL,
ADD COLUMN     "fromNetwork" "Network" NOT NULL,
ADD COLUMN     "toAmount" DECIMAL(36,18) NOT NULL,
ADD COLUMN     "toAssetId" UUID NOT NULL,
ADD COLUMN     "toNetwork" "Network" NOT NULL,
ADD COLUMN     "totalFees" DECIMAL(36,18);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fromAssetId_fkey" FOREIGN KEY ("fromAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toAssetId_fkey" FOREIGN KEY ("toAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
