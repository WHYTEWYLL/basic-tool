/*
  Warnings:

  - Added the required column `submissionStatus` to the `ByeByeBitesSubmission` table without a default value. This is not possible if the table is not empty.
  - Made the column `title` on table `ByeByeBitesSubmission` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ByeByeBitesSubmissionStatus" AS ENUM ('PENDING_EXPIRATION_DATE', 'PENDING_RECEIPT_IDENTIFICATION', 'IDENTIFIED');

-- AlterTable
ALTER TABLE "ByeByeBitesSubmission" ADD COLUMN     "labelImageUrl" TEXT,
ADD COLUMN     "productImageUrl" TEXT,
ADD COLUMN     "receiptImageUrl" TEXT,
ADD COLUMN     "submissionStatus" "ByeByeBitesSubmissionStatus" NOT NULL,
ALTER COLUMN "title" SET NOT NULL;
