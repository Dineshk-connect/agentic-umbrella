import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { memberships: true, contractor: true }
    })
    if (!user) return res.status(401).json({ error: 'User not found' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}