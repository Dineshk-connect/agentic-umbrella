import { prisma } from '../lib/prisma.js'
import { transition } from '../services/stateMachine.js'

// ── POST /api/timesheets/:workRecordId/approve ───────────
export const approveTimesheet = async (req, res) => {
  try {
    const { workRecordId } = req.params
    const agencyOrgIds = req.user.memberships.map(m => m.orgId)

    const workRecord = await prisma.workRecord.findUnique({
      where: { id: workRecordId }
    })

    if (!workRecord) return res.status(404).json({ error: 'Work record not found' })

    // make sure this agency owns this work record
    if (!agencyOrgIds.includes(workRecord.agencyId)) {
      return res.status(403).json({ error: 'Not your work record to approve' })
    }

    // state machine — will throw if invalid
    const nextState = transition(workRecord.state, 'WORK_APPROVED')

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.workRecord.update({
        where: { id: workRecordId, version: workRecord.version }, // optimistic lock
        data: { state: nextState, version: { increment: 1 } }
      })

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          actorRole: req.user.memberships[0]?.role,
          orgId: workRecord.agencyId,
          eventType: 'TIMESHEET_APPROVED',
          workRecordId,
          beforeState: workRecord.state,
          afterState: nextState,
        }
      })

      return result
    })

    res.json({ message: 'Timesheet approved', workRecord: updated })
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
}

// ── POST /api/timesheets/:workRecordId/reject ────────────
export const rejectTimesheet = async (req, res) => {
  try {
    const { workRecordId } = req.params
    const { reason } = req.body  // rejection reason is mandatory

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' })
    }

    const agencyOrgIds = req.user.memberships.map(m => m.orgId)

    const workRecord = await prisma.workRecord.findUnique({
      where: { id: workRecordId }
    })

    if (!workRecord) return res.status(404).json({ error: 'Work record not found' })

    if (!agencyOrgIds.includes(workRecord.agencyId)) {
      return res.status(403).json({ error: 'Not your work record to reject' })
    }

    const nextState = transition(workRecord.state, 'WORK_REJECTED')

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.workRecord.update({
        where: { id: workRecordId, version: workRecord.version },
        data: { state: nextState, version: { increment: 1 } }
      })

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          actorRole: req.user.memberships[0]?.role,
          orgId: workRecord.agencyId,
          eventType: 'TIMESHEET_REJECTED',
          workRecordId,
          beforeState: workRecord.state,
          afterState: nextState,
          metadata: { reason }   // rejection reason stored permanently
        }
      })

      return result
    })

    res.json({ message: 'Timesheet rejected', workRecord: updated })
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
}