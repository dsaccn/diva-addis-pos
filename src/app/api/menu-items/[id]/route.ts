import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { backgroundSync } from '@/lib/sync-engine'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { recipes, ...body } = await req.json()

    // Fetch current item so we can compare quantities
    const before = await prisma.menuItem.findUnique({ where: { id } })

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        ...body,
        ...(recipes !== undefined ? {
          recipes: {
            deleteMany: {},
            create: recipes.map((r: any) => ({
              ingredientId: r.ingredientId,
              quantity: r.quantity
            }))
          }
        } : {})
      },
      include: { recipes: true }
    })

    // Log any stock changes
    if (before) {
      const session = await getSession()
      const userName = session?.fullName ?? 'Unknown'

      if (body.stockQuantity !== undefined && body.stockQuantity !== before.stockQuantity) {
        await prisma.inventoryLog.create({
          data: {
            itemName: item.name,
            type: 'STORE',
            action: 'SET',
            quantity: Math.abs(body.stockQuantity - before.stockQuantity),
            prevQty: before.stockQuantity,
            newQty: body.stockQuantity,
            userName,
          },
        })
        backgroundSync()
      }

      if (body.barQuantity !== undefined && body.barQuantity !== before.barQuantity) {
        await prisma.inventoryLog.create({
          data: {
            itemName: item.name,
            type: 'BAR',
            action: 'SET',
            quantity: Math.abs(body.barQuantity - before.barQuantity),
            prevQty: before.barQuantity,
            newQty: body.barQuantity,
            userName,
          },
        })
        backgroundSync()
      }
    }

    return NextResponse.json(item)
  } catch (err) {
    console.error('[PATCH /api/menu-items/[id]]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // First remove cancellations linked to order items of this menu item
    await prisma.cancellation.deleteMany({
      where: { orderItem: { menuItemId: id } },
    })

    // Then remove order items that reference this menu item
    await prisma.orderItem.deleteMany({ where: { menuItemId: id } })

    // Now safe to delete the menu item itself
    await prisma.menuItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/menu-items/[id]]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
