import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

export const register = async (req, res) => {
  try {
    const { name, email, password, orgName, orgType, role } = req.body

    // check if user already exists
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(400).json({ error: 'Email already in use' })

    const passwordHash = await bcrypt.hash(password, 12)

    // create org + user + membership in one atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organisation.create({
        data: { name: orgName, type: orgType }
      })

      const user = await tx.user.create({
        data: {
          name, email, passwordHash,
          memberships: {
            create: { orgId: org.id, role }
          }
        },
        include: { memberships: true }
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actorRole: role,
          orgId: org.id,
          eventType: 'USER_CREATED',
          metadata: { email, orgName, orgType }
        }
      })

      return { user, org }
    })

    const token = jwt.sign(
      { userId: result.user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role,
        orgId: result.org.id,
        orgType
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: true, contractor: true }
    })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        memberships: user.memberships,
        contractor: user.contractor
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login failed' })
  }
}

// protected route — returns current user from token
export const me = async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    memberships: req.user.memberships,
    contractor: req.user.contractor
  })
}