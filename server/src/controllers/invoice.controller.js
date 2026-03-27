import { prisma } from '../lib/prisma.js'
import { transition } from '../services/stateMachine.js'

// GET /api/invoices — view invoices for your org
export const getInvoices = async (req, res) => {
  try {
    const orgIds = req.user.memberships.map(m => m.orgId)
    const contractor = req.user.contractor

    const invoices = await prisma.invoice.findMany({
      where: contractor
        ? { contractorId: contractor.id }
        : { OR: [{ agencyId: { in: orgIds } }, { umbrellaId: { in: orgIds } }] },
      include: {
        workRecord: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(invoices)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/invoices/:invoiceId/approve — agency approves invoice
export const approveInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params
    const agencyOrgIds = req.user.memberships.map(m => m.orgId)

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { workRecord: true }
    })

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    if (!agencyOrgIds.includes(invoice.agencyId)) {
      return res.status(403).json({ error: 'Not your invoice to approve' })
    }
    if (invoice.state !== 'INVOICE_GENERATED') {
      return res.status(400).json({ error: `Cannot approve invoice in state: ${invoice.state}` })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { state: 'INVOICE_APPROVED' }
      })

      const updatedWorkRecord = await tx.workRecord.update({
        where: { id: invoice.workRecordId },
        data: { state: 'INVOICE_APPROVED', version: { increment: 1 } }
      })

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          actorRole: req.user.memberships[0]?.role,
          orgId: invoice.agencyId,
          eventType: 'INVOICE_APPROVED',
          workRecordId: invoice.workRecordId,
          beforeState: 'INVOICE_GENERATED',
          afterState: 'INVOICE_APPROVED',
          metadata: { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount }
        }
      })

      return { invoice: updatedInvoice, workRecord: updatedWorkRecord }
    })

    res.json({ message: 'Invoice approved', ...result })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// POST /api/invoices/:invoiceId/pay — agency marks as paid (triggers PAYMENT_PENDING)
export const markAsPaid = async (req, res) => {
  try {
    const { invoiceId } = req.params
    const { reference, fromAccount } = req.body

    if (!reference || !fromAccount) {
      return res.status(400).json({ error: 'reference and fromAccount are required' })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    if (invoice.state !== 'INVOICE_APPROVED') {
      return res.status(400).json({ error: `Invoice must be approved before payment` })
    }

    const result = await prisma.$transaction(async (tx) => {
      // create a pending payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: invoice.amount,
          reference,
          fromAccount,
          status: 'PENDING'
        }
      })

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { state: 'PAYMENT_PENDING' }
      })

      await tx.workRecord.update({
        where: { id: invoice.workRecordId },
        data: { state: 'PAYMENT_PENDING', version: { increment: 1 } }
      })

      return { payment, invoice: updatedInvoice }
    })

    res.json({
      message: 'Payment initiated. Awaiting bank confirmation.',
      ...result
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}