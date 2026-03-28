import { Router } from 'express'
import { getExceptions, resolveException, assignException } from '../controllers/exception.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()
router.use(authenticate)

router.get('/', requireRole('ADMIN', 'PAYROLL_OPERATOR'), getExceptions)
router.post('/:exceptionId/assign', requireRole('ADMIN'), assignException)
router.post('/:exceptionId/resolve', requireRole('ADMIN', 'PAYROLL_OPERATOR'), resolveException)

export default router