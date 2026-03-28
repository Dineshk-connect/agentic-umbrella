-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('PAYMENT_MISMATCH', 'INVALID_TAX_CODE', 'MISSING_NI_NUMBER', 'PAYROLL_ANOMALY', 'HMRC_SUBMISSION_FAILED', 'BANK_TRANSFER_UNRECOGNISED');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('OPEN', 'ASSIGNED', 'RESOLVED', 'ESCALATED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEventType" ADD VALUE 'COMPLIANCE_VALIDATED';
ALTER TYPE "AuditEventType" ADD VALUE 'COMPLIANCE_FAILED';
ALTER TYPE "AuditEventType" ADD VALUE 'EXCEPTION_RAISED';
ALTER TYPE "AuditEventType" ADD VALUE 'EXCEPTION_RESOLVED';
ALTER TYPE "AuditEventType" ADD VALUE 'PAYROLL_OVERRIDE';

-- CreateTable
CREATE TABLE "exceptions" (
    "id" TEXT NOT NULL,
    "workRecordId" TEXT,
    "type" "ExceptionType" NOT NULL,
    "status" "ExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "assignedTo" TEXT,
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "exceptions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_workRecordId_fkey" FOREIGN KEY ("workRecordId") REFERENCES "work_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
