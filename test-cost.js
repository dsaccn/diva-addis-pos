const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Get a drink item
  const drink = await p.menuItem.findFirst({ where: { category: { type: 'DRINK' } } })
  if (!drink) { console.log('No drink found'); return }
  
  console.log('Before:', drink.name, '-> costPrice:', drink.costPrice)
  
  // Simulate what the PATCH API does
  await p.menuItem.update({
    where: { id: drink.id },
    data: { costPrice: 85.5 }
  })
  
  const updated = await p.menuItem.findUnique({ where: { id: drink.id } })
  console.log('After:', updated.name, '-> costPrice:', updated.costPrice)
  
  // Reset it back to 0
  await p.menuItem.update({ where: { id: drink.id }, data: { costPrice: 0 } })
  console.log('Reset back to 0 ✓')
}

main().catch(console.error).finally(() => p.$disconnect())
