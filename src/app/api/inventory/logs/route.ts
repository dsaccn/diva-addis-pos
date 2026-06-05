import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const logs = await prisma.inventoryLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json(logs)
  } catch (err) {
    console.error('[GET /api/inventory/logs]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
