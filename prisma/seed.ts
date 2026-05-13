import { PrismaClient } from '@prisma/client'
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Diva Addis Lounge POS...')

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: adminHash, fullName: 'System Admin', role: 'ADMIN' },
  })
  console.log('✅ Admin user created: admin / admin123')

  // Create sample staff
  const managerHash = await bcrypt.hash('manager123', 10)
  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: { username: 'manager', passwordHash: managerHash, fullName: 'Selam Tesfaye', role: 'MANAGER', phone: '+251911223344' },
  })

  const cashierHash = await bcrypt.hash('cashier123', 10)
  await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: { username: 'cashier', passwordHash: cashierHash, fullName: 'Biruk Alemu', role: 'CASHIER', phone: '+251922334455' },
  })

  const waiterHash = await bcrypt.hash('waiter123', 10)
  await prisma.user.upsert({
    where: { username: 'waiter1' },
    update: {},
    create: { username: 'waiter1', passwordHash: waiterHash, fullName: 'Tigist Haile', role: 'WAITER', phone: '+251933445566' },
  })
  console.log('✅ Sample staff created')

  // Categories
  const starters = await prisma.category.upsert({ where: { id: 'starters' }, update: {}, create: { id: 'starters', name: 'Starters', type: 'FOOD' } })
  const mainCourse = await prisma.category.upsert({ where: { id: 'main' }, update: {}, create: { id: 'main', name: 'Main Course', type: 'FOOD' } })
  const juices = await prisma.category.upsert({ where: { id: 'juices' }, update: {}, create: { id: 'juices', name: 'Juices', type: 'DRINK' } })
  const beer = await prisma.category.upsert({ where: { id: 'beer' }, update: {}, create: { id: 'beer', name: 'Beer', type: 'DRINK' } })
  const spirits = await prisma.category.upsert({ where: { id: 'spirits' }, update: {}, create: { id: 'spirits', name: 'Spirits', type: 'DRINK' } })
  const cocktails = await prisma.category.upsert({ where: { id: 'cocktails' }, update: {}, create: { id: 'cocktails', name: 'Cocktails', type: 'DRINK' } })
  console.log('✅ Categories created')

  // Menu items
  const foodItems = [
    { id: 'f1', name: 'Tibs', description: 'Sautéed beef with spices', price: 280, categoryId: mainCourse.id },
    { id: 'f2', name: 'Kitfo', description: 'Ethiopian steak tartare', price: 320, categoryId: mainCourse.id },
    { id: 'f3', name: 'Doro Wat', description: 'Spicy chicken stew with injera', price: 260, categoryId: mainCourse.id },
    { id: 'f4', name: 'Shiro Wat', description: 'Chickpea flour stew', price: 180, categoryId: mainCourse.id },
    { id: 'f5', name: 'Sambusa (3 pcs)', description: 'Crispy fried pastry', price: 120, categoryId: starters.id },
    { id: 'f6', name: 'Salad', description: 'Fresh mixed salad', price: 150, categoryId: starters.id },
    { id: 'f7', name: 'French Fries', description: 'Crispy golden fries', price: 130, categoryId: starters.id },
    { id: 'f8', name: 'Firfir', description: 'Shredded injera with berbere', price: 200, categoryId: mainCourse.id },
  ]

  const drinkItems = [
    { id: 'd1', name: 'Heineken', price: 120, categoryId: beer.id, stockQuantity: 48, lowStockThreshold: 10 },
    { id: 'd2', name: 'Dashen Beer', price: 100, categoryId: beer.id, stockQuantity: 60, lowStockThreshold: 12 },
    { id: 'd3', name: 'Meta Beer', price: 90, categoryId: beer.id, stockQuantity: 72, lowStockThreshold: 12 },
    { id: 'd4', name: 'Bedele Beer', price: 85, categoryId: beer.id, stockQuantity: 48, lowStockThreshold: 10 },
    { id: 'd5', name: 'Johnnie Walker Red', price: 350, categoryId: spirits.id, stockQuantity: 12, lowStockThreshold: 3 },
    { id: 'd6', name: 'Jack Daniel\'s', price: 400, categoryId: spirits.id, stockQuantity: 8, lowStockThreshold: 3 },
    { id: 'd7', name: 'Tej (Local Wine)', price: 150, categoryId: spirits.id, stockQuantity: 24, lowStockThreshold: 5 },
    { id: 'd8', name: 'Mango Juice', price: 80, categoryId: juices.id, stockQuantity: 30, lowStockThreshold: 8 },
    { id: 'd9', name: 'Avocado Juice', price: 90, categoryId: juices.id, stockQuantity: 25, lowStockThreshold: 8 },
    { id: 'd10', name: 'Mojito', price: 200, categoryId: cocktails.id, stockQuantity: 0, lowStockThreshold: 5 },
    { id: 'd11', name: 'Piña Colada', price: 220, categoryId: cocktails.id, stockQuantity: 0, lowStockThreshold: 5 },
    { id: 'd12', name: 'Soft Drink (Can)', price: 60, categoryId: juices.id, stockQuantity: 100, lowStockThreshold: 20 },
    { id: 'd13', name: 'Water (500ml)', price: 30, categoryId: juices.id, stockQuantity: 200, lowStockThreshold: 30 },
  ]

  for (const item of foodItems) {
    await prisma.menuItem.upsert({ where: { id: item.id }, update: {}, create: { ...item, stockQuantity: 0, lowStockThreshold: 0 } })
  }
  for (const item of drinkItems) {
    await prisma.menuItem.upsert({ where: { id: item.id }, update: {}, create: item })
  }
  console.log('✅ Menu items seeded')

  // Tables
  const tableNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', 'VIP 1', 'VIP 2', 'Bar 1', 'Bar 2']
  for (const number of tableNumbers) {
    await prisma.table.upsert({ where: { number }, update: {}, create: { number } })
  }
  console.log('✅ Tables created:', tableNumbers.join(', '))

  console.log('\n🎉 Seed complete! Login with:')
  console.log('   Admin:   admin / admin123')
  console.log('   Manager: manager / manager123')
  console.log('   Cashier: cashier / cashier123')
  console.log('   Waiter:  waiter1 / waiter123')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
