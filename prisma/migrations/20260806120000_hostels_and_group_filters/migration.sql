-- AlterTable
ALTER TABLE "EventAssignmentGroup" ADD COLUMN "targetFieldKey" TEXT,
ADD COLUMN "targetFieldValue" TEXT;

-- CreateTable
CREATE TABLE "EventHostel" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchIds" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventHostel_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN "hostelId" TEXT;

-- CreateIndex
CREATE INDEX "EventHostel_eventId_sortOrder_idx" ON "EventHostel"("eventId", "sortOrder");

-- CreateIndex
CREATE INDEX "EventRegistration_hostelId_idx" ON "EventRegistration"("hostelId");

-- AddForeignKey
ALTER TABLE "EventHostel" ADD CONSTRAINT "EventHostel_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "EventHostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
