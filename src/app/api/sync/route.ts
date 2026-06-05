/**
 * /api/sync
 *
 * GET  – returns pending record count (local SQLite, no network)
 * POST – triggers full bidirectional sync (pull from cloud + push to cloud)
 */

import { NextResponse } from 'next/server'
import { syncBothDirections, pullFromCloud, getPendingSyncCount } from '@/lib/sync-engine'

export async function GET() {
  if (process.env.VERCEL) {
    return NextResponse.json({ pendingCount: 0, isCloud: true })
  }

  try {
    const pendingCount = await getPendingSyncCount()
    return NextResponse.json({ pendingCount, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[GET /api/sync]', err)
    return NextResponse.json({ pendingCount: 0, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json({
      success: true,
      synced: { orders: 0, orderItems: 0, payments: 0, cancellations: 0, inventoryLogs: 0 },
      pulled: { orders: 0, orderItems: 0 },
      errors: [],
      lastSyncedAt: new Date(),
      isCloud: true,
    })
  }

  // Check if this is a pull-only request
  const url = new URL(req.url)
  const pullOnly = url.searchParams.get('pull') === '1'

  try {
    if (pullOnly) {
      const result = await pullFromCloud()
      return NextResponse.json({
        success: result.errors.length === 0,
        pulled: result.pulled,
        errors: result.errors,
        lastSyncedAt: new Date(),
      })
    }

    const result = await syncBothDirections()
    return NextResponse.json(result, { status: result.success ? 200 : 207 })
  } catch (err) {
    console.error('[POST /api/sync]', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
