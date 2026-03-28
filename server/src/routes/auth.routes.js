import { Router } from 'express'
import { register, login, me,getOrganisations, registerContractor } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'



const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authenticate, me)
router.get('/organisations', getOrganisations)
router.post('/register/contractor', registerContractor)

export default router