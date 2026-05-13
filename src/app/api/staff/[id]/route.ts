import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { password, ...rest } = await req.json()
  const data: Record<string, unknown> = { ...rest }
  if (password) data.passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, fullName: true, role: true, phone: true, active: true },
  })
  return NextResponse.json(user)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.user.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ success: true })
}
