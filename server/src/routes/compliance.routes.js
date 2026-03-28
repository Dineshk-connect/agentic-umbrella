import { Router } from 'express'
import { validateCompliance, markCompleted } from '../controllers/compliance.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()
router.use(authenticate)

router.post('/:workRecordId/validate', requireRole('ADMIN', 'PAYROLL_OPERATOR'), validateCompliance)
router.post('/:workRecordId/complete', requireRole('ADMIN', 'PAYROLL_OPERATOR'), markCompleted)

export default router