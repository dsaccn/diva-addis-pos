import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const { name, unit, quantity, minThreshold } = await req.json()

    const item = await prisma.staffIngredient.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        unit: unit !== undefined ? unit : undefined,
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        minThreshold: minThreshold !== undefined ? Number(minThreshold) : undefined,
        // Any admin edit must re-sync to the cloud.
        pendingSync: true,
      }
    })
    return NextResponse.json(item)
  } catch (err) {
    console.error('[PATCH /api/staff-ingredients/[id]]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    // StaffRecipe rows referencing this ingredient cascade-delete with it.
    await prisma.staffIngredient.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Deleted staff ingredient' })
  } catch (err) {
    console.error('[DELETE /api/staff-ingredients/[id]]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
