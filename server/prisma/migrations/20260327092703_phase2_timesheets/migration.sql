-- CreateEnum
CREATE TYPE "WorkRecordState" AS ENUM ('WORK_SUBMITTED', 'WORK_APPROVED', 'WORK_REJECTED', 'INVOICE_GENERATED', 'INVOICE_APPROVED', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'PAYROLL_PROCESSING', 'PAYROLL_COMPLETED', 'COMPLIANCE_SUBMITTED', 'COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEventType" ADD VALUE 'TIMESHEET_SUBMITTED';
ALTER TYPE "AuditEventType" ADD VALUE 'TIMESHEET_APPROVED';
ALTER TYPE "AuditEventType" ADD VALUE 'TIMESHEET_REJECTED';
ALTER TYPE "AuditEventType" ADD VALUE 'WORK_RECORD_CREATED';

-- CreateTable
CREATE TABLE "work_records" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "umbrellaId" TEXT NOT NULL,
    "state" "WorkRecordState" NOT NULL DEFAULT 'WORK_SUBMITTED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" TEXT NOT NULL,
    "workRecordId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "weekStarting" TIMESTAMP(3) NOT NULL,
    "hoursWorked" DECIMAL(6,2) NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workRecordId_fkey" FOREIGN KEY ("workRecordId") REFERENCES "work_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_records" ADD CONSTRAINT "work_records_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_records" ADD CONSTRAINT "work_records_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_records" ADD CONSTRAINT "work_records_umbrellaId_fkey" FOREIGN KEY ("umbrellaId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_workRecordId_fkey" FOREIGN KEY ("workRecordId") REFERENCES "work_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
