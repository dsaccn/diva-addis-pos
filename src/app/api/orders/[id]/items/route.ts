import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper: deduct ingredient stock based on recipes
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

// Mark items as printed
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { itemIds } = await req.json()
    await prisma.orderItem.updateMany({
      where: { id: { in: itemIds } },
      data: { status: 'PRINTED', printedAt: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/orders/[id]/items]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Add more items to an existing order
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { items } = await req.json()

    if (!items?.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Create new order items
    await prisma.orderItem.createMany({
      data: items.map((item: { menuItemId: string; quantity: number; notes?: string }) => ({
        orderId: id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
    })

    // Deduct drink bottle stock
    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { category: true },
      })
      if (menuItem?.category?.type === 'DRINK' && menuItem.stockQuantity > 0) {
        await prisma.menuItem.update({
          where: { id: item.menuItemId },
          data: { stockQuantity: { decrement: item.quantity } },
        })
      }
    }

    // Deduct ingredient stock based on recipes
    await deductIngredients(items)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/orders/[id]/items]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
