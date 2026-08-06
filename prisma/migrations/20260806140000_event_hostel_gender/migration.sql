-- CreateEnum
CREATE TYPE "HostelGender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "EventHostel" ADD COLUMN "gender" "HostelGender" NOT NULL DEFAULT 'MALE';
