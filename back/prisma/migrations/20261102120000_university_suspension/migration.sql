-- AlterTable
ALTER TABLE "University" ADD COLUMN "suspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "University" ADD COLUMN "suspendedMonth" INTEGER;
ALTER TABLE "University" ADD COLUMN "suspendedYear" INTEGER;

