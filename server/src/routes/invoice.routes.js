import { Router } from 'express'
import { getInvoices, approveInvoice, markAsPaid } from '../controllers/invoice.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.use(authenticate)

router.get('/', getInvoices)
router.post('/:invoiceId/approve', requireRole('ADMIN'), approveInvoice)
router.post('/:invoiceId/pay', requireRole('ADMIN'), markAsPaid)

export default router