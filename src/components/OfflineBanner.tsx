'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { WifiOff, Wifi, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'

type SyncState = 'online-synced' | 'online-syncing' | 'online-pending' | 'offline' | 'error'

export default function OfflineBanner() {
  // mounted=false during SSR; only show banner after client hydration
  const [mounted, setMounted] = useState(false)
  const [syncState, setSyncState] = useState<SyncState>('online-synced')
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [visible, setVisible] = useState(false) // Start hidden to avoid SSR mismatch
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setVisible(false), 5000)
  }, [])

  const fetchPendingCount = useCallback(async (): Promise<number> => {
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' })
      if (!res.ok) return 0
      const data = await res.json()
      return data.pendingCount ?? 0
    } catch {
      return 0
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return
    setSyncState('online-syncing')
    setVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    try {
      const res = await fetch('/api/sync', { method: 'POST', cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.success !== false) {
        setLastSynced(new Date().toLocaleTimeString())
        setSyncState('online-synced')
        setPendingCount(0)
        scheduleHide()
        // Notify other components that sync completed
        window.dispatchEvent(new CustomEvent('sync-complete'))
      } else {
        setSyncState('error')
        setVisible(true)
      }
    } catch {
      setSyncState('error')
      setVisible(true)
    }
  }, [scheduleHide])

  const updateStatus = useCallback(async () => {
    const online = navigator.onLine
    const count = await fetchPendingCount()
    setPendingCount(count)

    if (!online) {
      setSyncState('offline')
      setVisible(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      return
    }

    if (count > 0) {
      setSyncState('online-pending')
      setVisible(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      // Auto-sync
      triggerSync()
    } else {
      setSyncState('online-synced')
      setVisible(true)
      scheduleHide()
    }
  }, [fetchPendingCount, triggerSync, scheduleHide])

  useEffect(() => {
    // Only run on client after hydration
    setMounted(true)
    setVisible(true)

    // Intercept window.fetch to trigger sync on successful write mutations
    if (typeof window !== 'undefined' && !(window as any).__fetchHooked) {
      (window as any).__fetchHooked = true
      const originalFetch = window.fetch
      window.fetch = async function(...args) {
        const response = await originalFetch(...args)
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url || ''
        const options = args[1]
        const method = options?.method?.toUpperCase() || 'GET'

        if (
          response.ok &&
          ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) &&
          (url.includes('/api/orders') ||
           url.includes('/api/payments') ||
           url.includes('/api/cancellations') ||
           url.includes('/api/tables') ||
           url.includes('/api/menu-items') ||
           url.includes('/api/categories'))
        ) {
          window.dispatchEvent(new CustomEvent('db-write-success'))
        }
        return response
      }
    }

    // Force a full sync to/from cloud on page load/refresh if online, otherwise check status
    if (navigator.onLine) {
      triggerSync()
    } else {
      updateStatus()
    }

    // Poll every 60 seconds
    const interval = setInterval(updateStatus, 60_000)

    const handleOnline = async () => {
      const count = await fetchPendingCount()
      setPendingCount(count)
      setVisible(true)
      if (count > 0) {
        triggerSync()
      } else {
        setSyncState('online-synced')
        scheduleHide()
      }
    }

    const handleOffline = () => {
      setSyncState('offline')
      setVisible(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }

    const handleWriteSuccess = () => {
      if (navigator.onLine) {
        triggerSync()
      } else {
        updateStatus()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('db-write-success', handleWriteSuccess)

    return () => {
      clearInterval(interval)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('db-write-success', handleWriteSuccess)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Don't render anything on the server — this component is client-only
  if (!mounted) return null
  if (!visible) return null

  const config: Record<SyncState, {
    bg: string; border: string; color: string; icon: React.ReactNode; message: string
  }> = {
    'offline': {
      bg: 'rgba(220, 38, 38, 0.12)',
      border: 'rgba(220, 38, 38, 0.35)',
      color: '#ef4444',
      icon: <WifiOff size={14} />,
      message: pendingCount > 0
        ? `No internet — ${pendingCount} change${pendingCount !== 1 ? 's' : ''} saved locally`
        : 'No internet — working offline',
    },
    'online-pending': {
      bg: 'rgba(217, 119, 6, 0.1)',
      border: 'rgba(217, 119, 6, 0.3)',
      color: '#f59e0b',
      icon: <Wifi size={14} />,
      message: `${pendingCount} unsaved change${pendingCount !== 1 ? 's' : ''} — syncing to cloud…`,
    },
    'online-syncing': {
      bg: 'rgba(201, 168, 76, 0.1)',
      border: 'rgba(201, 168, 76, 0.3)',
      color: '#c9a84c',
      icon: <RefreshCw size={14} className="ob-spin" />,
      message: 'Syncing to cloud…',
    },
    'online-synced': {
      bg: 'rgba(34, 197, 94, 0.08)',
      border: 'rgba(34, 197, 94, 0.25)',
      color: '#22c55e',
      icon: <CheckCircle size={14} />,
      message: lastSynced ? `✓ Cloud synced at ${lastSynced}` : '✓ All data synced to cloud',
    },
    'error': {
      bg: 'rgba(220, 38, 38, 0.1)',
      border: 'rgba(220, 38, 38, 0.3)',
      color: '#ef4444',
      icon: <AlertTriangle size={14} />,
      message: 'Sync failed — will retry when internet is stable',
    },
  }

  const c = config[syncState]

  return (
    <div
      className="offline-banner"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 9999,
        background: c.bg,
        borderBottom: `1px solid ${c.border}`,
        color: c.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '7px 16px',
        fontSize: '12px',
        fontWeight: '500',
        letterSpacing: '0.3px',
        backdropFilter: 'blur(6px)',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      {c.icon}
      <span>{c.message}</span>
      {syncState === 'error' && (
        <button
          onClick={triggerSync}
          style={{
            marginLeft: '8px',
            padding: '2px 10px',
            borderRadius: '10px',
            border: `1px solid ${c.color}`,
            background: 'transparent',
            color: c.color,
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Retry
        </button>
      )}
      {syncState === 'online-synced' && (
        <span style={{ marginLeft: '8px', fontSize: '10px', opacity: 0.6 }}>
          (hides in 5s)
        </span>
      )}
    </div>
  )
}
