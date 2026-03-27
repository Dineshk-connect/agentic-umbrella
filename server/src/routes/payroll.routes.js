import { Router } from 'express'
import { triggerPayroll, getPayroll, getPayslip } from '../controllers/payroll.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.use(authenticate)

// only payroll operators and umbrella admins can trigger payroll
router.post('/:workRecordId/run', requireRole('ADMIN', 'PAYROLL_OPERATOR'), triggerPayroll)
router.get('/:workRecordId', authenticate, getPayroll)
router.get('/:workRecordId/payslip', authenticate, getPayslip)

export default router