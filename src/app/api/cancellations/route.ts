import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cancel an order item (requires manager approval)
export async function POST(req: Request) {
  const { orderItemId, managerId, reason } = await req.json()

  // Update item status
  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status: 'CANCELLED' },
  })

  // Log cancellation
  const cancellation = await prisma.cancellation.create({
    data: { orderItemId, managerId, reason },
    include: {
      orderItem: { include: { menuItem: true } },
      manager: { select: { fullName: true } },
    },
  })

  return NextResponse.json(cancellation)
}

export async function GET() {
  const cancellations = await prisma.cancellation.findMany({
    include: {
      orderItem: { include: { menuItem: true, order: { include: { table: true, waiter: { select: { fullName: true } } } } } },
      manager: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(cancellations)
}
