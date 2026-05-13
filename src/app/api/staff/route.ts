import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, fullName: true, role: true, phone: true, active: true, createdAt: true },
    orderBy: { fullName: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const { username, password, fullName, role, phone } = await req.json()
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, passwordHash, fullName, role, phone },
    select: { id: true, username: true, fullName: true, role: true, phone: true, active: true },
  })
  return NextResponse.json(user)
}
