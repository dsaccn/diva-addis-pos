/**
 * sync-engine.ts
 * Uses the `pg` package directly for Neon (cloud PostgreSQL).
 * Uses Prisma for local SQLite only.
 *
 * Why pg directly? After switching Prisma to SQLite provider, the generated
 * client is SQLite-only and cannot connect to PostgreSQL anymore.
 */

import { prisma } from '@/lib/prisma'
import { Client as PgClient } from 'pg'

export interface SyncResult {
  success: boolean
  pulled: { menuItems: number; categories: number; tables: number; users: number }
  synced: { orders: number; orderItems: number; payments: number; cancellations: number }
  errors: string[]
  lastSyncedAt: Date | null
}

let isSyncing = false

async function connectNeon(): Promise<PgClient> {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error('NEON_DATABASE_URL is not set in .env')
  const client = new PgClient({
    connectionString: url,
    connectionTimeoutMillis: 8000,
    statement_timeout: 15000,
  })
  await client.connect()
  return client
}

/**
 * Quick check: can we reach the Neon database?
 * Uses a short timeout so it fails fast if offline.
 */
export async function isCloudReachable(): Promise<boolean> {
  const url = process.env.NEON_DATABASE_URL
  if (!url) return false
  const client = new PgClient({
    connectionString: url,
    connectionTimeoutMillis: 4000,
  })
  try {
    await client.connect()
    await client.query('SELECT 1')
    return true
  } catch {
    return false
  } finally {
    await client.end().catch(() => {})
  }
}

/**
 * Count how many local records are waiting to be pushed to cloud.
 */
export async function getPendingSyncCount(): Promise<number> {
  const [orders, orderItems, payments, cancellations] = await Promise.all([
    prisma.order.count({ where: { pendingSync: true } }),
    prisma.orderItem.count({ where: { pendingSync: true } }),
    prisma.payment.count({ where: { pendingSync: true } }),
    prisma.cancellation.count({ where: { pendingSync: true } }),
  ])
  return orders + orderItems + payments + cancellations
}

/**
 * Fire-and-forget sync — call from API routes after writes.
 * Does not block the response. Skips if already syncing.
 */
export function backgroundSync(): void {
  // On Vercel, we write directly to Neon database already, so no sync is needed.
  if (process.env.VERCEL) return

  if (isSyncing) return
  syncToCloud().catch(e => console.warn('[BackgroundSync] Error:', String(e)))
}

/**
 * PULL: Neon → SQLite
 * Fetches the latest reference data (menu, tables, users) from Neon
 * and upserts it into the local SQLite DB so local data stays current.
 */
async function pullFromCloud(pg: PgClient): Promise<SyncResult['pulled']> {
  const pulled = { menuItems: 0, categories: 0, tables: 0, users: 0 }

  // Users
  const { rows: users } = await pg.query('SELECT * FROM "User"')
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        username: u.username, passwordHash: u.passwordHash,
        fullName: u.fullName, role: u.role,
        phone: u.phone ?? null, active: u.active,
      },
      create: {
        id: u.id, username: u.username, passwordHash: u.passwordHash,
        fullName: u.fullName, role: u.role,
        phone: u.phone ?? null, active: u.active, createdAt: new Date(u.createdAt),
      },
    }).catch(() => {}) // skip if constraint fails
    pulled.users++
  }

  // Categories
  const { rows: cats } = await pg.query('SELECT * FROM "Category"')
  for (const c of cats) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: { name: c.name, type: c.type },
      create: { id: c.id, name: c.name, type: c.type, createdAt: new Date(c.createdAt) },
    }).catch(() => {})
    pulled.categories++
  }

  // Menu Items — parents before children (null parentItemId first)
  const { rows: items } = await pg.query(
    'SELECT * FROM "MenuItem" ORDER BY "parentItemId" ASC NULLS FIRST'
  )
  for (const m of items) {
    await prisma.menuItem.upsert({
      where: { id: m.id },
      update: {
        name: m.name, description: m.description ?? null,
        price: parseFloat(m.price), available: m.available,
        stockQuantity: parseInt(m.stockQuantity ?? 0),
        barQuantity: parseInt(m.barQuantity ?? 0),
        costPrice: parseFloat(m.costPrice ?? 0),
        lowStockThreshold: parseInt(m.lowStockThreshold ?? 5),
        categoryId: m.categoryId ?? null,
        parentItemId: m.parentItemId ?? null,
        unitMultiplier: parseFloat(m.unitMultiplier ?? 1),
      },
      create: {
        id: m.id,
        categoryId: m.categoryId ?? null,
        name: m.name,
        description: m.description ?? null,
        price: parseFloat(m.price),
        available: m.available,
        stockQuantity: parseInt(m.stockQuantity ?? 0),
        barQuantity: parseInt(m.barQuantity ?? 0),
        costPrice: parseFloat(m.costPrice ?? 0),
        lowStockThreshold: parseInt(m.lowStockThreshold ?? 5),
        parentItemId: m.parentItemId ?? null,
        unitMultiplier: parseFloat(m.unitMultiplier ?? 1),
        createdAt: new Date(m.createdAt),
      },
    }).catch(() => {})
    pulled.menuItems++
  }

  // Tables
  const { rows: tables } = await pg.query('SELECT * FROM "Table"')
  for (const t of tables) {
    await prisma.table.upsert({
      where: { id: t.id },
      update: { number: t.number, status: t.status, mergedWithId: t.mergedWithId ?? null },
      create: {
        id: t.id, number: t.number, status: t.status,
        mergedWithId: t.mergedWithId ?? null, createdAt: new Date(t.createdAt),
      },
    }).catch(() => {})
    pulled.tables++
  }

  return pulled
}

/**
 * PUSH: SQLite → Neon
 * Finds all local records with pendingSync=true and upserts them into Neon.
 */
async function pushToCloud(
  pg: PgClient
): Promise<{ orders: number; orderItems: number; payments: number; cancellations: number; errors: string[] }> {
  const result = {
    orders: 0, orderItems: 0, payments: 0, cancellations: 0, errors: [] as string[],
  }

  // Orders
  const pendingOrders = await prisma.order.findMany({ where: { pendingSync: true } })
  for (const o of pendingOrders) {
    try {
      await pg.query(
        `INSERT INTO "Order" (id, "tableId", "waiterId", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, "updatedAt" = EXCLUDED."updatedAt"`,
        [o.id, o.tableId, o.waiterId, o.status, o.createdAt, o.updatedAt]
      )
      await prisma.order.update({
        where: { id: o.id },
        data: { pendingSync: false, syncedAt: new Date() },
      })
      result.orders++
    } catch (e) {
      result.errors.push(`Order ${o.id}: ${String(e)}`)
    }
  }

  // OrderItems
  const pendingItems = await prisma.orderItem.findMany({ where: { pendingSync: true } })
  for (const oi of pendingItems) {
    try {
      await pg.query(
        `INSERT INTO "OrderItem" (id, "orderId", "menuItemId", quantity, notes, status, "printedAt", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           quantity = EXCLUDED.quantity,
           notes = EXCLUDED.notes,
           "printedAt" = EXCLUDED."printedAt"`,
        [oi.id, oi.orderId, oi.menuItemId, oi.quantity, oi.notes, oi.status, oi.printedAt, oi.createdAt]
      )
      await prisma.orderItem.update({
        where: { id: oi.id },
        data: { pendingSync: false },
      })
      result.orderItems++
    } catch (e) {
      result.errors.push(`OrderItem ${oi.id}: ${String(e)}`)
    }
  }

  // Payments
  const pendingPayments = await prisma.payment.findMany({ where: { pendingSync: true } })
  for (const pay of pendingPayments) {
    try {
      await pg.query(
        `INSERT INTO "Payment" (id, "orderId", "cashierId", amount, method, discount, "discountType", "isComplimentary", notes, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           amount = EXCLUDED.amount,
           method = EXCLUDED.method,
           discount = EXCLUDED.discount,
           notes = EXCLUDED.notes`,
        [
          pay.id, pay.orderId, pay.cashierId, pay.amount,
          pay.method, pay.discount, pay.discountType,
          pay.isComplimentary, pay.notes, pay.createdAt,
        ]
      )
      await prisma.payment.update({
        where: { id: pay.id },
        data: { pendingSync: false },
      })
      result.payments++
    } catch (e) {
      result.errors.push(`Payment ${pay.id}: ${String(e)}`)
    }
  }

  // Cancellations
  const pendingCancellations = await prisma.cancellation.findMany({ where: { pendingSync: true } })
  for (const c of pendingCancellations) {
    try {
      await pg.query(
        `INSERT INTO "Cancellation" (id, "orderItemId", "managerId", reason, "createdAt")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET reason = EXCLUDED.reason`,
        [c.id, c.orderItemId, c.managerId, c.reason, c.createdAt]
      )
      await prisma.cancellation.update({
        where: { id: c.id },
        data: { pendingSync: false },
      })
      result.cancellations++
    } catch (e) {
      result.errors.push(`Cancellation ${c.id}: ${String(e)}`)
    }
  }

  return result
}

/**
 * Main sync: pull latest from Neon, then push local pending changes.
 */
export async function syncToCloud(): Promise<SyncResult> {
  if (isSyncing) {
    return {
      success: false,
      pulled: { menuItems: 0, categories: 0, tables: 0, users: 0 },
      synced: { orders: 0, orderItems: 0, payments: 0, cancellations: 0 },
      errors: ['Sync already in progress'],
      lastSyncedAt: null,
    }
  }

  isSyncing = true
  let pg: PgClient | null = null

  try {
    pg = await connectNeon()

    // Pull latest reference data from Neon first (menus, tables, users)
    const pulled = await pullFromCloud(pg)

    // Push local pending changes to Neon
    const pushed = await pushToCloud(pg)

    return {
      success: pushed.errors.length === 0,
      pulled,
      synced: {
        orders: pushed.orders,
        orderItems: pushed.orderItems,
        payments: pushed.payments,
        cancellations: pushed.cancellations,
      },
      errors: pushed.errors,
      lastSyncedAt: new Date(),
    }
  } catch (e) {
    return {
      success: false,
      pulled: { menuItems: 0, categories: 0, tables: 0, users: 0 },
      synced: { orders: 0, orderItems: 0, payments: 0, cancellations: 0 },
      errors: [`Fatal sync error: ${String(e)}`],
      lastSyncedAt: null,
    }
  } finally {
    isSyncing = false
    if (pg) await pg.end().catch(() => {})
  }
}
