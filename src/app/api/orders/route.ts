import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper: deduct ingredient stock for a list of ordered items
async function deductIngredients(items: { menuItemId: string; quantity: number }[]) {
  for (const item of items) {
    const recipes = await prisma.recipe.findMany({
      where: { menuItemId: item.menuItemId },
      include: { ingredient: true },
    })
    for (const recipe of recipes) {
      const needed = recipe.quantity * item.quantity
      const newQty = Math.max(0, recipe.ingredient.quantity - needed)
      await prisma.ingredient.update({
        where: { id: recipe.ingredientId },
        data: { quantity: newQty },
      })
    }
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tableId = searchParams.get('tableId')
    const status = searchParams.get('status')

    const orders = await prisma.order.findMany({
      where: {
        ...(tableId && { tableId }),
        ...(status && { status }),
      },
      include: {
        table: true,
        waiter: { select: { id: true, fullName: true, username: true } },
        orderItems: {
          include: { menuItem: { include: { category: true } }, cancellation: true },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (err) {
    console.error('[GET /api/orders]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { tableId, waiterId, items } = await req.json()

    if (!tableId || !waiterId || !items?.length) {
      return NextResponse.json({ error: 'Missing tableId, waiterId, or items' }, { status: 400 })
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        tableId,
        waiterId,
        orderItems: {
          create: items.map((item: { menuItemId: string; quantity: number; notes?: string }) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        table: true,
        waiter: { select: { id: true, fullName: true } },
        orderItems: { include: { menuItem: { include: { category: true } } } },
      },
    })

    // Update table status to OCCUPIED
    await prisma.table.update({ where: { id: tableId }, data: { status: 'OCCUPIED' } })

    // Deduct drink bottle stock
    for (const item of order.orderItems) {
      if (item.menuItem.category?.type === 'DRINK' && item.menuItem.stockQuantity > 0) {
        await prisma.menuItem.update({
          where: { id: item.menuItemId },
          data: { stockQuantity: { decrement: item.quantity } },
        })
      }
    }

    // Deduct ingredient stock based on recipes
    await deductIngredients(items)

    return NextResponse.json(order)
  } catch (err) {
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
