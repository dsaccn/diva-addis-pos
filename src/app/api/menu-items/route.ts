import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.menuItem.findMany({
    include: { category: true, recipes: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const { recipes, ...body } = await req.json()
  const item = await prisma.menuItem.create({
    data: {
      ...body,
      recipes: recipes ? {
        create: recipes.map((r: any) => ({
          ingredientId: r.ingredientId,
          quantity: r.quantity
        }))
      } : undefined
    },
    include: { recipes: true }
  })
  return NextResponse.json(item)
}
