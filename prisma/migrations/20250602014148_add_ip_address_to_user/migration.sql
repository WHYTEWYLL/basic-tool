/*
  Warnings:

  - Added the optional column `ipAddress` to the `User` table without a default value. This means that it will be filled with `NULL` for existing rows.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "ipAddress" TEXT; 