import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const category = await prisma.category.update({ where: { id }, data: body })
    return NextResponse.json(category)
  } catch (err) {
    console.error('[PATCH /api/categories/[id]]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE /api/categories/[id]]', err)
    if (err.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete category because it has menu items attached to it. Please delete or reassign the menu items first.' }, { status: 400 })
    }
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
