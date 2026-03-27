import { Router } from 'express'
import { submitTimesheet, resubmitTimesheet, getWorkRecords } from '../controllers/timesheet.controller.js'
import { approveTimesheet, rejectTimesheet } from '../controllers/approval.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

// all routes require login
router.use(authenticate)

// contractor routes
router.post('/', requireRole('CONTRACTOR'), submitTimesheet)
router.post('/:workRecordId/resubmit', requireRole('CONTRACTOR'), resubmitTimesheet)

// agency routes
router.post('/:workRecordId/approve', requireRole('ADMIN', 'CONSULTANT'), approveTimesheet)
router.post('/:workRecordId/reject', requireRole('ADMIN', 'CONSULTANT'), rejectTimesheet)

// all roles can view
router.get('/', getWorkRecords)

export default router