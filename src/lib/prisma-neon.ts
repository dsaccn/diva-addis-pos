/**
 * prisma-neon.ts
 * A separate PrismaClient that connects to Neon (cloud PostgreSQL).
 * This is used ONLY by the sync engine — never by regular API routes.
 * All API routes use the local SQLite client from `prisma.ts`.
 */

import { PrismaClient } from '@prisma/client'

// Lazy singleton — only created when sync engine needs it
let neonPrisma: PrismaClient | null = null

export function getNeonPrisma(): PrismaClient {
  if (!neonPrisma) {
    const url = process.env.NEON_DATABASE_URL
    if (!url) {
      throw new Error('NEON_DATABASE_URL is not set in environment variables')
    }
    neonPrisma = new PrismaClient({
      datasources: {
        db: { url },
      },
    })
  }
  return neonPrisma
}

export async function disconnectNeon() {
  if (neonPrisma) {
    await neonPrisma.$disconnect()
    neonPrisma = null
  }
}
