const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const items = await prisma.menuItem.findMany({
    include: { category: true, recipes: true }
  })
  console.log('Items:', items.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
