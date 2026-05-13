import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const body = await req.json()
  const item = await prisma.menuItem.create({ data: body })
  return NextResponse.json(item)
}
