import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const staff = await prisma.staffMember.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(staff)
  } catch (err) {
    console.error('[GET /api/staff-members]', err)
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
    const { name, role, shift } = await req.json()
    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 })
    }

    const staff = await prisma.staffMember.create({
      data: { name, role, shift: shift || 'Morning' }
    })
    return NextResponse.json(staff)
  } catch (err) {
    console.error('[POST /api/staff-members]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
