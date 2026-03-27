import 'dotenv/config'
import pkg from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const { PrismaClient } = pkg

const globalForPrisma = globalThis

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma