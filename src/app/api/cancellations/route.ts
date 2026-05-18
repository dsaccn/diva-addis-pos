import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cancel an order item (requires manager approval)
export async function POST(req: Request) {
  const { orderItemId, managerId, reason, cancelQuantity } = await req.json()

  const orderItem = await prisma.orderItem.findUnique({ where: { id: orderItemId } })
  if (!orderItem) {
    return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
  }

  let cancelledItemId = orderItemId

  const qtyToCancel = cancelQuantity && cancelQuantity > 0 ? Number(cancelQuantity) : orderItem.quantity

  if (qtyToCancel < orderItem.quantity) {
    // Partial cancellation: reduce original quantity, create a new cancelled item
    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { quantity: orderItem.quantity - qtyToCancel },
    })
    const newCancelledItem = await prisma.orderItem.create({
      data: {
        orderId: orderItem.orderId,
        menuItemId: orderItem.menuItemId,
        quantity: qtyToCancel,
        notes: orderItem.notes,
        status: 'CANCELLED',
      }
    })
    cancelledItemId = newCancelledItem.id
  } else {
    // Full cancellation
    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: 'CANCELLED' },
    })
  }

  // Log cancellation
  const cancellation = await prisma.cancellation.create({
    data: { orderItemId: cancelledItemId, managerId, reason },
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
