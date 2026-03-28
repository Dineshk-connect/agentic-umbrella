import { prisma } from '../lib/prisma.js'
import { runComplianceCheck, completeWorkRecord } from '../services/compliance.service.js'

// POST /api/compliance/:workRecordId/validate
export const validateCompliance = async (req, res) => {
  try {
    const { workRecordId } = req.params
    const result = await runComplianceCheck(workRecordId, req.user.id)
    const status = result.passed ? 200 : 422
    res.status(status).json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// POST /api/compliance/:workRecordId/complete
export const markCompleted = async (req, res) => {
  try {
    const { workRecordId } = req.params
    const result = await completeWorkRecord(workRecordId, req.user.id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}