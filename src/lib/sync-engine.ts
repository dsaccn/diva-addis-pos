/**
 * sync-engine.ts — v3 (bidirectional)
 *
 * PUSH: local SQLite (pendingSync=true) → Neon
 * PULL: Neon OPEN orders not present locally → local SQLite
 *
 * Design:
 *  - getPool() creates one shared pg.Pool, reused across requests.
 *  - isSyncing guard serialises concurrent sync runs.
 *  - pullFromCloud() uses record ID presence to decide what to insert:
 *      • Order exists locally + pendingSync=true  → local wins, skip
 *      • Order exists locally + pendingSync=false → sync status from cloud
 *      • Order not in local at all               → it's cloud-native, insert it
 *  - On Vercel every function is a no-op (Vercel writes directly to Neon).
 */

import { prisma } from '@/lib/prisma'
import { Pool as PgPool } from 'pg'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean
  synced: { orders: number; orderItems: number; payments: number; cancellations: number; inventoryLogs: number }
  pulled: { orders: number; orderItems: number }
  errors: string[]
  lastSyncedAt: Date | null
}

// ─── Shared pool (created lazily, reused across requests) ─────────────────────

let _pool: PgPool | null = null

function getPool(): PgPool {
  if (!_pool) {
    const url = process.env.NEON_DATABASE_URL
    if (!url) throw new Error('NEON_DATABASE_URL is not set in .env')
    _pool = new PgPool({
      connectionString: url,
      max: 3,
      // 3 s — fail-fast when offline so the app never hangs waiting for Neon
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
      ssl: { rejectUnauthorized: false },
    })
    _pool.on('error', (err) => {
      console.warn('[SyncEngine] Pool error (offline?):', err.message)
      // Destroy the pool so the next sync attempt creates a fresh one
      _pool = null
    })
  }
  return _pool
}

/** Destroy the pool so the next call to getPool() creates a fresh connection.
 *  Called when a sync fails due to network error so we don't reuse a dead pool. */
function resetPool() {
  if (_pool) {
    _pool.end().catch(() => {})
    _pool = null
  }
}

// ─── Sync state ───────────────────────────────────────────────────────────────

let isSyncing = false

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Count how many local records are waiting to be pushed.
 * Fast — only touches local SQLite, no network call.
 */
export async function getPendingSyncCount(): Promise<number> {
  const [orders, orderItems, payments, cancellations, inventoryLogs] = await Promise.all([
    prisma.order.count({ where: { pendingSync: true } }),
    prisma.orderItem.count({ where: { pendingSync: true } }),
    prisma.payment.count({ where: { pendingSync: true } }),
    prisma.cancellation.count({ where: { pendingSync: true } }),
    prisma.inventoryLog.count({ where: { pendingSync: true } }),
  ])
  return orders + orderItems + payments + cancellations + inventoryLogs
}

/**
 * Fire-and-forget bidirectional sync — call from API routes after writes.
 * Does not block the response. Skips if already syncing.
 */
export function backgroundSync(): void {
  if (process.env.VERCEL) return
  if (isSyncing) return
  syncBothDirections().catch((e) => console.warn('[BackgroundSync]', String(e)))
}

/**
 * Pull cloud-native orders (created on Vercel) into local SQLite.
 *
 * Rules:
 *  - If order exists locally with pendingSync=true → local is being modified, SKIP
 *  - If order exists locally with pendingSync=false → already synced, update status only
 *  - If order does NOT exist locally → it's cloud-native, INSERT it
 */
export async function pullFromCloud(): Promise<{ pulled: { orders: number; orderItems: number }; errors: string[] }> {
  if (process.env.VERCEL) {
    return { pulled: { orders: 0, orderItems: 0 }, errors: [] }
  }

  const errors: string[] = []
  const pulled = { orders: 0, orderItems: 0 }

  try {
    const pg = getPool()

    // ── Pull static metadata (User, Category, Ingredient, MenuItem, Recipe, Table) ──
    try {
      // 0. Users / Staff
      const { rows: cloudUsers } = await pg.query(
        `SELECT id, username, "passwordHash", "fullName", role, phone, active, "createdAt" FROM "User"`
      )
      const userIds = cloudUsers.map(u => u.id)

      try {
        await prisma.user.deleteMany({
          where: { id: { notIn: userIds } }
        })
      } catch (e) {
        console.warn('[Pull static] User delete warning:', String(e))
      }

      for (const u of cloudUsers) {
        await prisma.user.upsert({
          where: { id: u.id },
          update: {
            username: u.username,
            passwordHash: u.passwordHash,
            fullName: u.fullName,
            role: u.role,
            phone: u.phone,
            active: Boolean(u.active),
            createdAt: new Date(u.createdAt),
          },
          create: {
            id: u.id,
            username: u.username,
            passwordHash: u.passwordHash,
            fullName: u.fullName,
            role: u.role,
            phone: u.phone,
            active: Boolean(u.active),
            createdAt: new Date(u.createdAt),
          },
        })
      }

      // 1. Categories
      const { rows: cloudCats } = await pg.query(
        `SELECT id, name, type, "createdAt" FROM "Category"`
      )
      const catIds = cloudCats.map(c => c.id)
      
      try {
        await prisma.category.deleteMany({
          where: { id: { notIn: catIds } }
        })
      } catch (e) {
        console.warn('[Pull static] Category delete warning:', String(e))
      }

      for (const c of cloudCats) {
        await prisma.category.upsert({
          where: { id: c.id },
          update: { name: c.name, type: c.type, createdAt: new Date(c.createdAt) },
          create: { id: c.id, name: c.name, type: c.type, createdAt: new Date(c.createdAt) },
        })
      }

      // 2. Ingredients
      const { rows: cloudIngs } = await pg.query(
        `SELECT id, name, unit, quantity, "minThreshold", "createdAt" FROM "Ingredient"`
      )
      const ingIds = cloudIngs.map(i => i.id)

      try {
        await prisma.ingredient.deleteMany({
          where: { id: { notIn: ingIds } }
        })
      } catch (e) {
        console.warn('[Pull static] Ingredient delete warning:', String(e))
      }

      for (const i of cloudIngs) {
        await prisma.ingredient.upsert({
          where: { id: i.id },
          update: { 
            name: i.name, 
            unit: i.unit, 
            quantity: Number(i.quantity), 
            minThreshold: Number(i.minThreshold), 
            createdAt: new Date(i.createdAt) 
          },
          create: { 
            id: i.id, 
            name: i.name, 
            unit: i.unit, 
            quantity: Number(i.quantity), 
            minThreshold: Number(i.minThreshold), 
            createdAt: new Date(i.createdAt) 
          },
        })
      }

      // 3. MenuItems
      const { rows: cloudItems } = await pg.query(
        `SELECT id, "categoryId", name, description, price, available, "stockQuantity", "barQuantity", "costPrice", "lowStockThreshold", "parentItemId", "unitMultiplier", "createdAt" FROM "MenuItem"`
      )
      const itemIds = cloudItems.map(item => item.id)

      try {
        await prisma.menuItem.deleteMany({
          where: { id: { notIn: itemIds } }
        })
      } catch (e) {
        console.warn('[Pull static] MenuItem delete warning:', String(e))
      }

      // First pass: upsert with parentItemId = null to avoid self-referential foreign key constraint issues
      for (const item of cloudItems) {
        await prisma.menuItem.upsert({
          where: { id: item.id },
          update: {
            categoryId: item.categoryId,
            name: item.name,
            description: item.description,
            price: Number(item.price),
            available: Boolean(item.available),
            stockQuantity: Number(item.stockQuantity),
            barQuantity: Number(item.barQuantity),
            costPrice: Number(item.costPrice),
            lowStockThreshold: Number(item.lowStockThreshold),
            parentItemId: null,
            unitMultiplier: Number(item.unitMultiplier),
            createdAt: new Date(item.createdAt),
          },
          create: {
            id: item.id,
            categoryId: item.categoryId,
            name: item.name,
            description: item.description,
            price: Number(item.price),
            available: Boolean(item.available),
            stockQuantity: Number(item.stockQuantity),
            barQuantity: Number(item.barQuantity),
            costPrice: Number(item.costPrice),
            lowStockThreshold: Number(item.lowStockThreshold),
            parentItemId: null,
            unitMultiplier: Number(item.unitMultiplier),
            createdAt: new Date(item.createdAt),
          },
        })
      }

      // Second pass: update parentItemId links
      for (const item of cloudItems) {
        if (item.parentItemId) {
          await prisma.menuItem.update({
            where: { id: item.id },
            data: { parentItemId: item.parentItemId },
          })
        }
      }

      // 4. Recipes
      const { rows: cloudRecipes } = await pg.query(
        `SELECT id, "menuItemId", "ingredientId", quantity FROM "Recipe"`
      )
      const recipeIds = cloudRecipes.map(r => r.id)

      try {
        await prisma.recipe.deleteMany({
          where: { id: { notIn: recipeIds } }
        })
      } catch (e) {
        console.warn('[Pull static] Recipe delete warning:', String(e))
      }

      for (const r of cloudRecipes) {
        await prisma.recipe.upsert({
          where: { id: r.id },
          update: {
            menuItemId: r.menuItemId,
            ingredientId: r.ingredientId,
            quantity: Number(r.quantity),
          },
          create: {
            id: r.id,
            menuItemId: r.menuItemId,
            ingredientId: r.ingredientId,
            quantity: Number(r.quantity),
          },
        })
      }

      // 5. Tables
      const { rows: cloudTables } = await pg.query(
        `SELECT id, number, status, "mergedWithId", "createdAt" FROM "Table"`
      )
      const tableIds = cloudTables.map(t => t.id)

      try {
        await prisma.table.deleteMany({
          where: { id: { notIn: tableIds } }
        })
      } catch (e) {
        console.warn('[Pull static] Table delete warning:', String(e))
      }

      for (const t of cloudTables) {
        await prisma.table.upsert({
          where: { id: t.id },
          update: {
            number: t.number,
            status: t.status,
            mergedWithId: t.mergedWithId,
            createdAt: new Date(t.createdAt),
          },
          create: {
            id: t.id,
            number: t.number,
            status: t.status,
            mergedWithId: t.mergedWithId,
            createdAt: new Date(t.createdAt),
          },
        })
      }
    } catch (e) {
      console.warn('[Pull static warning]', String(e))
      errors.push(`Static sync warning: ${String(e)}`)
    }

    // Fetch all OPEN orders from Neon
    const { rows: cloudOrders } = await pg.query(
      `SELECT id, "tableId", "waiterId", status, "createdAt", "updatedAt" FROM "Order" WHERE status = 'OPEN' ORDER BY "createdAt" DESC`
    )

    for (const co of cloudOrders) {
      try {
        const localOrder = await prisma.order.findUnique({ where: { id: co.id } })

        if (!localOrder) {
          // Cloud-native order — check that the waiter exists locally before inserting
          const waiterExists = await prisma.user.findUnique({ where: { id: co.waiterId } })
          if (!waiterExists) {
            // Waiter account doesn't exist locally yet; skip gracefully
            console.warn(`[Pull] Order ${co.id} skipped — waiter ${co.waiterId} not in local DB`)
            continue
          }

          // Insert the order
          await prisma.order.create({
            data: {
              id: co.id,
              tableId: co.tableId,
              waiterId: co.waiterId,
              status: co.status,
              createdAt: new Date(co.createdAt),
              updatedAt: new Date(co.updatedAt),
              pendingSync: false, // already exists on cloud
            },
          })

          // Pull order items for this order
          const { rows: cloudItems } = await pg.query(
            `SELECT id, "orderId", "menuItemId", quantity, notes, status, "printedAt", "createdAt"
             FROM "OrderItem" WHERE "orderId" = $1`,
            [co.id]
          )

          for (const ci of cloudItems) {
            try {
              const localItem = await prisma.orderItem.findUnique({ where: { id: ci.id } })
              if (!localItem) {
                // Verify menuItem exists locally
                const menuItemExists = await prisma.menuItem.findUnique({ where: { id: ci.menuItemId } })
                if (!menuItemExists) {
                  console.warn(`[Pull] OrderItem ${ci.id} skipped — menuItem ${ci.menuItemId} not found locally`)
                  continue
                }
                await prisma.orderItem.create({
                  data: {
                    id: ci.id,
                    orderId: ci.orderId,
                    menuItemId: ci.menuItemId,
                    quantity: ci.quantity,
                    notes: ci.notes ?? null,
                    status: ci.status,
                    printedAt: ci.printedAt ? new Date(ci.printedAt) : null,
                    createdAt: new Date(ci.createdAt),
                    pendingSync: false,
                  },
                })
                pulled.orderItems++
              }
            } catch (e) {
              errors.push(`Pull OrderItem ${ci.id}: ${String(e)}`)
            }
          }

          // Mark table as OCCUPIED locally
          await prisma.table.update({
            where: { id: co.tableId },
            data: { status: 'OCCUPIED' },
          }).catch(() => {
            // Table might not exist locally — skip silently
            console.warn(`[Pull] Table ${co.tableId} not found locally, skipping status update`)
          })

          pulled.orders++
        } else if (!localOrder.pendingSync) {
          // Record exists and is clean — sync status from cloud only if it's more terminal.
          // NEVER downgrade: if local is PAID or CANCELLED, cloud (still OPEN because not
          // synced yet) must NOT revert the local payment. Terminal statuses always win.
          const terminalLocally = localOrder.status === 'PAID' || localOrder.status === 'CANCELLED'
          if (!terminalLocally && localOrder.status !== co.status) {
            await prisma.order.update({
              where: { id: co.id },
              data: { status: co.status, updatedAt: new Date(co.updatedAt) },
            })
            // If cloud closed the order, free the table locally
            if (co.status !== 'OPEN') {
              await prisma.table.update({
                where: { id: co.tableId },
                data: { status: 'FREE' },
              }).catch(() => {})
            }
          }
        }
        // If localOrder.pendingSync = true → local write in flight, skip
      } catch (e) {
        errors.push(`Pull Order ${co.id}: ${String(e)}`)
      }
    }

    return { pulled, errors }
  } catch (e) {
    // Network/connection failed — reset pool so next attempt starts fresh
    resetPool()
    return {
      pulled,
      errors: [`Fatal pull error (offline?): ${String(e)}`],
    }
  }
}

/**
 * Push all pending local records to Neon.
 * Safe to call concurrently — isSyncing guard serialises runs.
 */
export async function syncToCloud(): Promise<SyncResult> {
  if (process.env.VERCEL) {
    return {
      success: true,
      synced: { orders: 0, orderItems: 0, payments: 0, cancellations: 0, inventoryLogs: 0 },
      pulled: { orders: 0, orderItems: 0 },
      errors: [],
      lastSyncedAt: new Date(),
    }
  }

  if (isSyncing) {
    return {
      success: false,
      synced: { orders: 0, orderItems: 0, payments: 0, cancellations: 0, inventoryLogs: 0 },
      pulled: { orders: 0, orderItems: 0 },
      errors: ['Sync already in progress'],
      lastSyncedAt: null,
    }
  }

  isSyncing = true
  const errors: string[] = []
  const synced = { orders: 0, orderItems: 0, payments: 0, cancellations: 0, inventoryLogs: 0 }

  try {
    const pg = getPool()

    // ── Pull cloud-native records first ───────────────────────────────────────
    // (runs inside the isSyncing lock so we don't double-connect)
    const pullResult = await pullFromCloud()
    errors.push(...pullResult.errors)

    // ── Orders ────────────────────────────────────────────────────────────────
    const pendingOrders = await prisma.order.findMany({ where: { pendingSync: true } })
    for (const o of pendingOrders) {
      try {
        await pg.query(
          `INSERT INTO "Order" (id, "tableId", "waiterId", status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             status      = EXCLUDED.status,
             "updatedAt" = EXCLUDED."updatedAt"`,
          [o.id, o.tableId, o.waiterId, o.status, o.createdAt, o.updatedAt]
        )
        const tableStatus = o.status === 'OPEN' ? 'OCCUPIED' : 'FREE'
        await pg.query('UPDATE "Table" SET status = $1 WHERE id = $2', [tableStatus, o.tableId])

        await prisma.order.update({
          where: { id: o.id },
          data: { pendingSync: false, syncedAt: new Date() },
        })
        synced.orders++
      } catch (e) {
        errors.push(`Order ${o.id}: ${String(e)}`)
      }
    }

    // ── OrderItems ────────────────────────────────────────────────────────────
    const pendingItems = await prisma.orderItem.findMany({ where: { pendingSync: true } })
    for (const oi of pendingItems) {
      try {
        await pg.query(
          `INSERT INTO "OrderItem" (id, "orderId", "menuItemId", quantity, notes, status, "printedAt", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             status      = EXCLUDED.status,
             quantity    = EXCLUDED.quantity,
             notes       = EXCLUDED.notes,
             "printedAt" = EXCLUDED."printedAt"`,
          [oi.id, oi.orderId, oi.menuItemId, oi.quantity, oi.notes, oi.status, oi.printedAt, oi.createdAt]
        )
        await prisma.orderItem.update({
          where: { id: oi.id },
          data: { pendingSync: false },
        })
        synced.orderItems++
      } catch (e) {
        errors.push(`OrderItem ${oi.id}: ${String(e)}`)
      }
    }

    // ── Payments ──────────────────────────────────────────────────────────────
    const pendingPayments = await prisma.payment.findMany({
      where: { pendingSync: true },
      include: { order: true },
    })
    for (const pay of pendingPayments) {
      try {
        await pg.query(
          `INSERT INTO "Payment" (id, "orderId", "cashierId", amount, method, discount, "discountType", "isComplimentary", notes, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT ("orderId") DO UPDATE SET
             amount   = EXCLUDED.amount,
             method   = EXCLUDED.method,
             discount = EXCLUDED.discount,
             notes    = EXCLUDED.notes`,
          [
            pay.id, pay.orderId, pay.cashierId,
            pay.amount, pay.method, pay.discount,
            pay.discountType, pay.isComplimentary, pay.notes, pay.createdAt,
          ]
        )
        if (pay.order) {
          await pg.query('UPDATE "Table" SET status = $1 WHERE id = $2', ['FREE', pay.order.tableId])
        }
        await prisma.payment.update({
          where: { id: pay.id },
          data: { pendingSync: false },
        })
        synced.payments++
      } catch (e) {
        errors.push(`Payment ${pay.id}: ${String(e)}`)
      }
    }

    // ── Cancellations ─────────────────────────────────────────────────────────
    const pendingCancellations = await prisma.cancellation.findMany({ where: { pendingSync: true } })
    for (const c of pendingCancellations) {
      try {
        await pg.query(
          `INSERT INTO "Cancellation" (id, "orderItemId", "managerId", reason, "createdAt")
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT ("orderItemId") DO UPDATE SET reason = EXCLUDED.reason`,
          [c.id, c.orderItemId, c.managerId, c.reason, c.createdAt]
        )
        await prisma.cancellation.update({
          where: { id: c.id },
          data: { pendingSync: false },
        })
        synced.cancellations++
      } catch (e) {
        errors.push(`Cancellation ${c.id}: ${String(e)}`)
      }
    }

    // ── InventoryLogs ─────────────────────────────────────────────────────────
    const pendingLogs = await prisma.inventoryLog.findMany({ where: { pendingSync: true } })
    for (const log of pendingLogs) {
      try {
        await pg.query(
          `INSERT INTO "InventoryLog" (id, "itemName", type, action, quantity, "prevQty", "newQty", "userName", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [log.id, log.itemName, log.type, log.action, log.quantity, log.prevQty, log.newQty, log.userName, log.createdAt]
        )
        await prisma.inventoryLog.update({
          where: { id: log.id },
          data: { pendingSync: false },
        })
        synced.inventoryLogs++
      } catch (e) {
        errors.push(`InventoryLog ${log.id}: ${String(e)}`)
      }
    }

    return {
      success: errors.length === 0,
      synced,
      pulled: pullResult.pulled,
      errors,
      lastSyncedAt: new Date(),
    }
  } catch (e) {
    // Network/connection failed — reset pool so next attempt starts fresh
    resetPool()
    return {
      success: false,
      synced,
      pulled: { orders: 0, orderItems: 0 },
      errors: [`Fatal sync error (offline?): ${String(e)}`],
      lastSyncedAt: null,
    }
  } finally {
    isSyncing = false
  }
}

/**
 * Runs pull then push in sequence.
 * Alias kept for clarity when called from the /api/sync POST handler.
 */
export const syncBothDirections = syncToCloud
