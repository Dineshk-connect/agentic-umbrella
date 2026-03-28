import { prisma } from '../lib/prisma.js'

// GET /api/audit — full immutable audit trail
export const getAuditLogs = async (req, res) => {
  try {
    const { workRecordId, eventType, limit = 50, page = 1 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {}
    if (workRecordId) where.workRecordId = workRecordId
    if (eventType) where.eventType = eventType

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip
      }),
      prisma.auditLog.count({ where })
    ])

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/audit/work-record/:workRecordId — full trail for one work record
export const getWorkRecordAuditTrail = async (req, res) => {
  try {
    const { workRecordId } = req.params

    const logs = await prisma.auditLog.findMany({
      where: { workRecordId },
      include: {
        actor: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'asc' }  // asc so you see the story in order
    })

    res.json({
      workRecordId,
      totalEvents: logs.length,
      trail: logs
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}