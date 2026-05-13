import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const ingredient = await prisma.ingredient.update({ where: { id }, data: body })
    return NextResponse.json(ingredient)
  } catch (err) {
    console.error('[PATCH /api/ingredients/[id]]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Remove from all recipes first
    await prisma.recipe.deleteMany({ where: { ingredientId: id } })
    await prisma.ingredient.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/ingredients/[id]]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
