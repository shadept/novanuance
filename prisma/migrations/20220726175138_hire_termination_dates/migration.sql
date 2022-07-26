/*
  Warnings:

  - Added the required column `hireDate` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee"
  ADD COLUMN "hireDate" TIMESTAMP(3),
  ADD COLUMN "terminationDate" TIMESTAMP(3);

UPDATE "Employee"
  SET "hireDate" = '1970-01-01'::timestamp;

ALTER TABLE "Employee"
  ALTER COLUMN "hireDate" SET NOT NULL;
