import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateFilter = {
    ...(from && { gte: new Date(from) }),
    ...(to && { lte: new Date(to + 'T23:59:59') }),
  }

  const [payments, orders, orderItems, cancellations, inventory] = await Promise.all([
    prisma.payment.findMany({
      where: from || to ? { createdAt: dateFilter } : {},
      include: {
        order: {
          include: {
            table: true,
            waiter: { select: { fullName: true } },
            orderItems: { include: { menuItem: { include: { category: true } } } },
          },
        },
        cashier: { select: { fullName: true } },
      },
    }),
    prisma.order.findMany({
      where: { status: 'PAID', ...(from || to ? { createdAt: dateFilter } : {}) },
    }),
    prisma.orderItem.findMany({
      where: { status: { not: 'CANCELLED' }, ...(from || to ? { createdAt: dateFilter } : {}) },
      include: { menuItem: { include: { category: true } } },
    }),
    prisma.cancellation.findMany({
      where: from || to ? { createdAt: dateFilter } : {},
      include: {
        orderItem: { include: { menuItem: true, order: { include: { table: true, waiter: { select: { fullName: true } } } } } },
        manager: { select: { fullName: true } },
      },
    }),
    prisma.menuItem.findMany({ include: { category: true }, orderBy: { name: 'asc' } }),
  ])

  // Total revenue
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

  // Revenue by payment method
  const revenueByMethod: Record<string, number> = {}
  payments.forEach(p => { revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + p.amount })

  // Best selling items
  const itemSales: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {}
  orderItems.forEach(oi => {
    const key = oi.menuItemId
    if (!itemSales[key]) itemSales[key] = { name: oi.menuItem.name, category: oi.menuItem.category?.name || '', quantity: 0, revenue: 0 }
    itemSales[key].quantity += oi.quantity
    itemSales[key].revenue += oi.quantity * oi.menuItem.price
  })
  const bestSelling = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10)

  // Staff performance
  const staffPerf: Record<string, { name: string; orders: number; revenue: number }> = {}
  payments.forEach(p => {
    const name = p.order.waiter.fullName
    if (!staffPerf[name]) staffPerf[name] = { name, orders: 0, revenue: 0 }
    staffPerf[name].orders++
    staffPerf[name].revenue += p.amount
  })

  // Transactions
  const transactions = payments.map(p => ({
    id: p.id,
    date: p.createdAt,
    amount: p.amount,
    method: p.method,
    cashier: p.cashier?.fullName || 'Unknown',
    waiter: p.order.waiter.fullName,
    table: p.order.table.number,
    items: p.order.orderItems.map((oi: any) => `${oi.quantity}x ${oi.menuItem.name}`).join(', ')
  }))

  // Daily Sales
  const dailyMap: Record<string, { date: string; orders: number; revenue: number }> = {}
  payments.forEach(p => {
    const d = new Date(p.createdAt).toISOString().split('T')[0]
    if (!dailyMap[d]) dailyMap[d] = { date: d, orders: 0, revenue: 0 }
    dailyMap[d].orders++
    dailyMap[d].revenue += p.amount
  })
  const dailySales = Object.values(dailyMap).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Low stock items
  const lowStock = inventory.filter(i => i.stockQuantity <= i.lowStockThreshold)

  return NextResponse.json({
    totalRevenue,
    totalOrders: orders.length,
    revenueByMethod,
    bestSelling,
    staffPerformance: Object.values(staffPerf),
    cancellations,
    inventory,
    lowStock,
    transactions,
    dailySales
  })
}
