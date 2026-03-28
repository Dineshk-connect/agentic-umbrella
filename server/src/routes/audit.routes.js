import { Router } from 'express'
import { getAuditLogs, getWorkRecordAuditTrail } from '../controllers/audit.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()
router.use(authenticate)

router.get('/', requireRole('ADMIN', 'PAYROLL_OPERATOR'), getAuditLogs)
router.get('/work-record/:workRecordId', authenticate, getWorkRecordAuditTrail)

export default router