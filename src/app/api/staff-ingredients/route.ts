import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const items = await prisma.staffIngredient.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(items)
  } catch (err) {
    console.error('[GET /api/staff-ingredients]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { name, unit, quantity, minThreshold } = await req.json()
    if (!name || !unit) {
      return NextResponse.json({ error: 'Name and unit are required' }, { status: 400 })
    }

    const item = await prisma.staffIngredient.create({
      data: {
        name,
        unit,
        quantity: Number(quantity) || 0,
        minThreshold: Number(minThreshold) || 0,
      }
    })
    return NextResponse.json(item)
  } catch (err) {
    console.error('[POST /api/staff-ingredients]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
