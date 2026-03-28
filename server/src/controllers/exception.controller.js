import { prisma } from '../lib/prisma.js'

// GET /api/exceptions — view all open exceptions
export const getExceptions = async (req, res) => {
  try {
    const { status } = req.query

    const exceptions = await prisma.exception.findMany({
      where: status ? { status } : {},
      include: {
        workRecord: true,
        assignee: { select: { id: true, name: true, email: true } },
        resolver: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(exceptions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/exceptions/:exceptionId/resolve
// resolution justification is MANDATORY — stored permanently
export const resolveException = async (req, res) => {
  try {
    const { exceptionId } = req.params
    const { resolution } = req.body

    if (!resolution || resolution.trim().length < 10) {
      return res.status(400).json({
        error: 'Resolution justification is required and must be at least 10 characters'
      })
    }

    const exception = await prisma.exception.findUnique({
      where: { id: exceptionId }
    })

    if (!exception) return res.status(404).json({ error: 'Exception not found' })
    if (exception.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Exception already resolved' })
    }

    const resolved = await prisma.$transaction(async (tx) => {
      const updated = await tx.exception.update({
        where: { id: exceptionId },
        data: {
          status: 'RESOLVED',
          resolvedBy: req.user.id,
          resolution: resolution.trim(),
          resolvedAt: new Date()
        }
      })

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          actorRole: req.user.memberships[0]?.role,
          eventType: 'EXCEPTION_RESOLVED',
          workRecordId: exception.workRecordId,
          metadata: {
            exceptionId,
            exceptionType: exception.type,
            resolution: resolution.trim()
          }
        }
      })

      return updated
    })

    res.json({ message: 'Exception resolved', exception: resolved })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/exceptions/:exceptionId/assign
export const assignException = async (req, res) => {
  try {
    const { exceptionId } = req.params
    const { assignToUserId } = req.body

    const updated = await prisma.exception.update({
      where: { id: exceptionId },
      data: {
        assignedTo: assignToUserId,
        status: 'ASSIGNED'
      }
    })

    res.json({ message: 'Exception assigned', exception: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}