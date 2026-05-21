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

  // Daily Sales with per-category item breakdown
  const dailyMap: Record<string, {
    date: string; orders: number; revenue: number
    categories: Record<string, { categoryName: string; items: Record<string, { name: string; quantity: number; revenue: number }> }>
  }> = {}

  payments.forEach(p => {
    const d = new Date(p.createdAt).toISOString().split('T')[0]
    if (!dailyMap[d]) dailyMap[d] = { date: d, orders: 0, revenue: 0, categories: {} }
    dailyMap[d].orders++
    dailyMap[d].revenue += p.amount

    p.order.orderItems.forEach((oi: any) => {
      if (oi.status === 'CANCELLED') return
      const catName = oi.menuItem.category?.name || 'Uncategorized'
      if (!dailyMap[d].categories[catName]) dailyMap[d].categories[catName] = { categoryName: catName, items: {} }
      const key = oi.menuItemId
      if (!dailyMap[d].categories[catName].items[key]) {
        dailyMap[d].categories[catName].items[key] = { name: oi.menuItem.name, quantity: 0, revenue: 0 }
      }
      dailyMap[d].categories[catName].items[key].quantity += oi.quantity
      dailyMap[d].categories[catName].items[key].revenue += oi.quantity * oi.menuItem.price
    })
  })

  const dailySales = Object.values(dailyMap)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(d => ({
      ...d,
      categories: Object.values(d.categories).map(cat => ({
        categoryName: cat.categoryName,
        items: Object.values(cat.items).sort((a, b) => b.quantity - a.quantity)
      }))
    }))

  // Low stock items
  const lowStock = inventory.filter(i => i.stockQuantity <= i.lowStockThreshold)

  // Generate deterministic Article Codes (P-0001, P-0002, etc.)
  const sortedInventory = [...inventory].sort((a, b) => a.name.localeCompare(b.name))
  const itemCodeMap = new Map<string, string>()
  sortedInventory.forEach((item, index) => {
    itemCodeMap.set(item.id, `P-${(index + 1).toString().padStart(4, '0')}`)
  })

  // Categorized Sales Report data
  const categoryGroups: Record<string, {
    categoryName: string
    subCategories: Record<string, {
      subCategoryName: string
      articles: Record<string, {
        code: string
        name: string
        quantity: number
        avgAmount: number
        totalAmount: number
      }>
    }>
  }> = {}

  let totalRetailDiscount = 0

  payments.forEach(p => {
    totalRetailDiscount += p.discount || 0
    p.order.orderItems.forEach((oi: any) => {
      if (oi.status === 'CANCELLED') return
      
      const rawType = oi.menuItem.category?.type || 'FOOD'
      const categoryName = rawType === 'DRINK' ? 'BEVERAGE' : rawType
      const subCategoryName = oi.menuItem.category?.name || 'Uncategorized'
      
      if (!categoryGroups[categoryName]) {
        categoryGroups[categoryName] = { categoryName, subCategories: {} }
      }
      
      if (!categoryGroups[categoryName].subCategories[subCategoryName]) {
        categoryGroups[categoryName].subCategories[subCategoryName] = { subCategoryName, articles: {} }
      }
      
      const articleId = oi.menuItemId
      const itemCode = itemCodeMap.get(articleId) || `P-${articleId.slice(-4).toUpperCase()}`
      
      if (!categoryGroups[categoryName].subCategories[subCategoryName].articles[articleId]) {
        categoryGroups[categoryName].subCategories[subCategoryName].articles[articleId] = {
          code: itemCode,
          name: oi.menuItem.name,
          quantity: 0,
          avgAmount: oi.menuItem.price,
          totalAmount: 0
        }
      }
      
      const art = categoryGroups[categoryName].subCategories[subCategoryName].articles[articleId]
      art.quantity += oi.quantity
      art.totalAmount = Math.round(art.quantity * art.avgAmount * 100) / 100
    })
  })

  const formattedCategories = Object.values(categoryGroups).map(cat => {
    const subCategories = Object.values(cat.subCategories).map(sub => {
      const articles = Object.values(sub.articles).sort((a, b) => a.name.localeCompare(b.name))
      const totalQuantity = articles.reduce((sum, a) => sum + a.quantity, 0)
      const totalRevenue = Math.round(articles.reduce((sum, a) => sum + a.totalAmount, 0) * 100) / 100
      
      return {
        subCategoryName: sub.subCategoryName.toUpperCase(),
        articles,
        totalQuantity,
        totalRevenue
      }
    }).sort((a, b) => a.subCategoryName.localeCompare(b.subCategoryName))

    const totalQuantity = subCategories.reduce((sum, s) => sum + s.totalQuantity, 0)
    const totalRevenue = Math.round(subCategories.reduce((sum, s) => sum + s.totalRevenue, 0) * 100) / 100

    return {
      categoryName: cat.categoryName,
      subCategories,
      totalQuantity,
      totalRevenue
    }
  }).sort((a, b) => b.categoryName.localeCompare(a.categoryName))

  const repSubTotal = Math.round(formattedCategories.reduce((sum, c) => sum + c.totalRevenue, 0) * 100) / 100
  const repDiscount = Math.round(totalRetailDiscount * 100) / 100
  const repGrandTotal = Math.round((repSubTotal - repDiscount) * 100) / 100
  const repTax = 0
  const repServiceCharge = 0

  const categorizedReport = {
    categories: formattedCategories,
    subTotal: repSubTotal,
    serviceCharge: repServiceCharge,
    discount: repDiscount,
    tax: repTax,
    grandTotal: repGrandTotal
  }

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
    dailySales,
    categorizedReport
  })
}
