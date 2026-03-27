-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEventType" ADD VALUE 'PAYROLL_TRIGGERED';
ALTER TYPE "AuditEventType" ADD VALUE 'PAYROLL_COMPLETED';

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "workRecordId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "umbrellaId" TEXT NOT NULL,
    "grossPay" DECIMAL(10,2) NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "hoursWorked" DECIMAL(6,2) NOT NULL,
    "incomeTax" DECIMAL(10,2) NOT NULL,
    "employeeNI" DECIMAL(10,2) NOT NULL,
    "employerNI" DECIMAL(10,2) NOT NULL,
    "umbrellaFee" DECIMAL(10,2) NOT NULL,
    "pensionEmployee" DECIMAL(10,2) NOT NULL,
    "studentLoan" DECIMAL(10,2) NOT NULL,
    "netPay" DECIMAL(10,2) NOT NULL,
    "taxCode" TEXT NOT NULL,
    "taxYear" TEXT NOT NULL,
    "payPeriodStart" TIMESTAMP(3) NOT NULL,
    "payPeriodEnd" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "state" TEXT NOT NULL DEFAULT 'PAYROLL_PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_workRecordId_key" ON "payrolls"("workRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payrollId_key" ON "payslips"("payrollId");

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_workRecordId_fkey" FOREIGN KEY ("workRecordId") REFERENCES "work_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_umbrellaId_fkey" FOREIGN KEY ("umbrellaId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
