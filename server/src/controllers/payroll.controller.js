import { prisma } from '../lib/prisma.js'
import { runPayroll } from '../services/payroll.service.js'

// POST /api/payroll/:workRecordId/run
export const triggerPayroll = async (req, res) => {
  try {
    const { workRecordId } = req.params

    const result = await runPayroll(workRecordId, req.user.id)

    res.json({
      message: 'Payroll completed. Net salary queued for disbursement.',
      payroll: result.payroll,
      payslip: result.payslip
    })
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
}

// GET /api/payroll/:workRecordId
export const getPayroll = async (req, res) => {
  try {
    const { workRecordId } = req.params

    const payroll = await prisma.payroll.findUnique({
      where: { workRecordId },
      include: { payslip: true }
    })

    if (!payroll) return res.status(404).json({ error: 'Payroll not found' })

    res.json(payroll)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/payroll/:workRecordId/payslip — contractor views their payslip
export const getPayslip = async (req, res) => {
  try {
    const { workRecordId } = req.params
    const contractor = req.user.contractor
    const orgIds = req.user.memberships.map(m => m.orgId)

    const payroll = await prisma.payroll.findUnique({
      where: { workRecordId },
      include: { payslip: true, workRecord: true }
    })

    if (!payroll) return res.status(404).json({ error: 'Payslip not found' })

    // contractors only see their own, orgs see their contractors
    const canView = contractor
      ? payroll.contractorId === contractor.id
      : orgIds.includes(payroll.umbrellaId)

    if (!canView) return res.status(403).json({ error: 'Access denied' })

    res.json(payroll.payslip)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}