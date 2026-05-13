import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } })
  return NextResponse.json(tables)
}

export async function POST(req: Request) {
  const { number } = await req.json()
  const table = await prisma.table.create({ data: { number } })
  return NextResponse.json(table)
}
