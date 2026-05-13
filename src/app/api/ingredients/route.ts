import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(ingredients)
  } catch (err) {
    console.error('[GET /api/ingredients]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ingredient = await prisma.ingredient.create({ data: body })
    return NextResponse.json(ingredient)
  } catch (err) {
    console.error('[POST /api/ingredients]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
