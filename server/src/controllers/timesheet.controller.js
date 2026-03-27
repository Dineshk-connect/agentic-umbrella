import { prisma } from '../lib/prisma.js'
import { transition } from '../services/stateMachine.js'

// ── POST /api/timesheets ─────────────────────────────────
// Contractor submits a new timesheet (creates WorkRecord too)
export const submitTimesheet = async (req, res) => {
  try {
    const { weekStarting, hoursWorked, notes } = req.body
    const contractor = req.user.contractor

    if (!contractor) {
      return res.status(403).json({ error: 'Only contractors can submit timesheets' })
    }

    const hourlyRate = Number(contractor.hourlyRate)
    const hours = Number(hoursWorked)
    const totalAmount = hours * hourlyRate

    const result = await prisma.$transaction(async (tx) => {
      // create the WorkRecord first
      const workRecord = await tx.workRecord.create({
        data: {
          contractorId: contractor.id,
          agencyId: contractor.agencyId,
          umbrellaId: contractor.umbrellaId,
          state: 'WORK_SUBMITTED'
        }
      })

      // create the timesheet linked to it
      const timesheet = await tx.timesheet.create({
        data: {
          workRecordId: workRecord.id,
          contractorId: contractor.id,
          weekStarting: new Date(weekStarting),
          hoursWorked: hours,
          hourlyRate,
          totalAmount,
          notes,
          version: 1,
          isActive: true
        }
      })

      // audit log
      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          actorRole: 'CONTRACTOR',
          orgId: contractor.agencyId,
          eventType: 'TIMESHEET_SUBMITTED',
          workRecordId: workRecord.id,
          beforeState: null,
          afterState: 'WORK_SUBMITTED',
          metadata: { hoursWorked: hours, weekStarting, totalAmount }
        }
      })

      return { workRecord, timesheet }
    })

    res.status(201).json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

// ── POST /api/timesheets/:workRecordId/resubmit ──────────
// Contractor resubmits after rejection — creates new version
export const resubmitTimesheet = async (req, res) => {
  try {
    const { workRecordId } = req.params
    const { weekStarting, hoursWorked, notes } = req.body
    const contractor = req.user.contractor

    const workRecord = await prisma.workRecord.findUnique({
      where: { id: workRecordId }
    })

    if (!workRecord) return res.status(404).json({ error: 'Work record not found' })
    if (workRecord.contractorId !== contractor.id) {
      return res.status(403).json({ error: 'Not your work record' })
    }

    // state machine check — can only resubmit from WORK_REJECTED
    const nextState = transition(workRecord.state, 'WORK_SUBMITTED')

    const hourlyRate = Number(contractor.hourlyRate)
    const hours = Number(hoursWorked)
    const totalAmount = hours * hourlyRate

    const result = await prisma.$transaction(async (tx) => {
      // deactivate old timesheet version
      await tx.timesheet.updateMany({
        where: { workRecordId, isActive: true },
        data: { isActive: false }
      })

      // get latest version number
      const lastVersion = await tx.timesheet.findFirst({
        where: { workRecordId },
        orderBy: { version: 'desc' }
      })

      // create new version
      const timesheet = await tx.timesheet.create({
        data: {
          workRecordId,
          contractorId: contractor.id,
          weekStarting: new Date(weekStarting),
          hoursWorked: hours,
          hourlyRate,
          totalAmount,
          notes,
          version: (lastVersion?.version ?? 0) + 1,
          isActive: true
        }
      })

      // update WorkRecord state + version (optimistic locking)
      const updated = await tx.workRecord.update({
        where: { id: workRecordId, version: workRecord.version },
        data: { state: nextState, version: { increment: 1 } }
      })

      if (!updated) {
        throw new Error('Conflict: work record was modified by another request')
      }

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          actorRole: 'CONTRACTOR',
          orgId: contractor.agencyId,
          eventType: 'TIMESHEET_SUBMITTED',
          workRecordId,
          beforeState: workRecord.state,
          afterState: nextState,
          metadata: { version: timesheet.version, hoursWorked: hours }
        }
      })

      return { workRecord: updated, timesheet }
    })

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/timesheets ───────────────────────────────────
// Get all work records relevant to the logged-in user
export const getWorkRecords = async (req, res) => {
  try {
    const user = req.user
    const contractor = user.contractor
    const orgIds = user.memberships.map(m => m.orgId)

    const workRecords = await prisma.workRecord.findMany({
      where: contractor
        ? { contractorId: contractor.id }           // contractor sees their own
        : { OR: [
            { agencyId: { in: orgIds } },           // agency sees their contractors
            { umbrellaId: { in: orgIds } }           // umbrella sees their contractors
          ]
        },
      include: {
        timesheets: { where: { isActive: true } },  // only active version
        contractor: { include: { user: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(workRecords)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}