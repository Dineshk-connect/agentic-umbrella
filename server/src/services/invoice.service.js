import { prisma } from '../lib/prisma.js'

// generates a unique invoice number like INV-2026-000042
async function generateInvoiceNumber() {
  const count = await prisma.invoice.count()
  const padded = String(count + 1).padStart(6, '0')
  const year = new Date().getFullYear()
  return `INV-${year}-${padded}`
}

// called automatically when timesheet is approved
export async function generateInvoice(workRecord, tx) {
  // get the active timesheet to know the amount
  const timesheet = await tx.timesheet.findFirst({
    where: { workRecordId: workRecord.id, isActive: true }
  })

  if (!timesheet) throw new Error('No active timesheet found for this work record')

  const invoiceNumber = await generateInvoiceNumber()

  // due date is 30 days from now
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  const invoice = await tx.invoice.create({
    data: {
      workRecordId: workRecord.id,
      agencyId: workRecord.agencyId,
      umbrellaId: workRecord.umbrellaId,
      contractorId: workRecord.contractorId,
      amount: timesheet.totalAmount,
      invoiceNumber,
      dueDate,
      state: 'INVOICE_GENERATED'
    }
  })

  await tx.auditLog.create({
    data: {
      eventType: 'INVOICE_GENERATED',
      workRecordId: workRecord.id,
      orgId: workRecord.umbrellaId,
      beforeState: 'WORK_APPROVED',
      afterState: 'INVOICE_GENERATED',
      metadata: { invoiceNumber, amount: timesheet.totalAmount }
    }
  })

  return invoice
}