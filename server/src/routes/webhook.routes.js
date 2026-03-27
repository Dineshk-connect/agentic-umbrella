import { Router } from 'express'
import { handlePaymentWebhook } from '../controllers/webhook.controller.js'

const router = Router()

// no auth — webhooks come from the bank, not a logged-in user
router.post('/payment', handlePaymentWebhook)

export default router