import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'
import os from 'os'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const dbUrl = new URL(process.env.DATABASE_URL!)
  const certPath = path.join(os.homedir(), '.postgresql', 'root.crt')
  const ca = fs.existsSync(certPath) ? fs.readFileSync(certPath).toString() : undefined

  const pool = new Pool({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '26257'),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace(/^\//, ''),
    ssl: ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: false },
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
