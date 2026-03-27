import { prisma } from '../lib/prisma.js'

// POST /api/webhooks/payment — simulates bank sending payment confirmation
export const handlePaymentWebhook = async (req, res) => {
  try {
    const { reference, amount, fromAccount } = req.body

    // find the payment by reference
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { invoice: { include: { workRecord: true } } }
    })

    if (!payment) {
      return res.status(404).json({ error: 'No payment found for this reference' })
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Payment already processed' })
    }

    const invoice = payment.invoice
    const receivedAmount = Number(amount)
    const expectedAmount = Number(invoice.amount)
    const amountsMatch = Math.abs(receivedAmount - expectedAmount) < 0.01
    const accountMatches = fromAccount === payment.fromAccount

    // MISMATCH — block workflow, raise exception
    if (!amountsMatch || !accountMatches) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'MISMATCHED' }
        })

        await tx.auditLog.create({
          data: {
            eventType: 'PAYMENT_MISMATCH',
            workRecordId: invoice.workRecordId,
            orgId: invoice.umbrellaId,
            beforeState: 'PAYMENT_PENDING',
            afterState: 'PAYMENT_PENDING',  // stays blocked
            metadata: {
              expected: expectedAmount,
              received: receivedAmount,
              expectedAccount: payment.fromAccount,
              receivedAccount: fromAccount,
              reason: !amountsMatch ? 'Amount mismatch' : 'Account mismatch'
            }
          }
        })
      })

      return res.status(400).json({
        error: 'Payment mismatch detected. Workflow blocked.',
        expected: expectedAmount,
        received: receivedAmount
      })
    }

    // MATCH — reconcile and unlock payroll
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'MATCHED', reconciledAt: new Date() }
      })

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { state: 'PAYMENT_RECEIVED', paidAt: new Date() }
      })

      // this is the critical unlock — payroll can now run
      await tx.workRecord.update({
        where: { id: invoice.workRecordId },
        data: { state: 'PAYMENT_RECEIVED', version: { increment: 1 } }
      })

      await tx.auditLog.create({
        data: {
          eventType: 'PAYMENT_RECEIVED',
          workRecordId: invoice.workRecordId,
          orgId: invoice.umbrellaId,
          beforeState: 'PAYMENT_PENDING',
          afterState: 'PAYMENT_RECEIVED',
          metadata: { reference, amount: receivedAmount }
        }
      })
    })

    res.json({
      message: 'Payment reconciled. Payroll is now unlocked.',
      reference,
      amount: receivedAmount
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}