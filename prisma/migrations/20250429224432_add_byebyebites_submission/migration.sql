-- CreateTable
CREATE TABLE "ByeByeBitesSubmission" (
    "id" UUID NOT NULL,
    "title" TEXT,
    "expirationDate" TIMESTAMP(3),
    "impactMealsDonated" INTEGER,
    "impactWaterSaved" INTEGER,
    "impactCarFreeDays" INTEGER,
    "impactEnergyOffset" INTEGER,

    CONSTRAINT "ByeByeBitesSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ByeByeBitesSubmission" ADD CONSTRAINT "ByeByeBitesSubmission_id_fkey" FOREIGN KEY ("id") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
