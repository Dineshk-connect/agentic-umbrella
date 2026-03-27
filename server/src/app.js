import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/auth.routes.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/auth', authRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

export default app