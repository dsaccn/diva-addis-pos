import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { recipes, ...body } = await req.json()
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
