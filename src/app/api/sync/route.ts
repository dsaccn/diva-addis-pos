/**
 * /api/sync
 * GET  – returns pending record count (fast, no Neon connection needed)
 * POST – triggers a full cloud sync (pull latest + push pending)
 *
 * NOTE: Online/offline detection is handled by navigator.onLine in the browser.
 * The GET endpoint deliberately does NOT check Neon reachability to avoid
 * showing "offline" when Neon is slow/paused but the internet is fine.
 */

import { NextResponse } from 'next/server'
import { syncToCloud, isCloudReachable, getPendingSyncCount } from '@/lib/sync-engine'

export async function GET() {
  if (process.env.VERCEL) {
    return NextResponse.json({
      pendingCount: 0,
      timestamp: new Date().toISOString(),
      isCloud: true,
    })
  }

  try {
    const pendingCount = await getPendingSyncCount()
    return NextResponse.json({
      pendingCount,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[GET /api/sync]', err)
    return NextResponse.json({ pendingCount: 0, error: String(err) }, { status: 500 })
  }
}

export async function POST() {
  if (process.env.VERCEL) {
    return NextResponse.json({
      success: true,
      pulled: { menuItems: 0, categories: 0, tables: 0, users: 0 },
      synced: { orders: 0, orderItems: 0, payments: 0, cancellations: 0 },
      errors: [],
      lastSyncedAt: new Date(),
      isCloud: true,
    })
  }

  try {
    // Only attempt sync if Neon is actually reachable
    const online = await isCloudReachable()
    if (!online) {
      return NextResponse.json(
        { success: false, error: 'Cloud database not reachable — will retry when online' },
        { status: 503 }
      )
    }

    const result = await syncToCloud()

    return NextResponse.json(result, {
      status: result.success ? 200 : 207, // 207 = partial success
    })
  } catch (err) {
    console.error('[POST /api/sync]', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
