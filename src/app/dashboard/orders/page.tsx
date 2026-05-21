'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Eye, RefreshCw } from 'lucide-react'

interface OrderItem { id: string; menuItem: { name: string; price: number; category?: { name: string; type: string } | null }; quantity: number; notes?: string; status: string }
interface Order { id: string; table: { number: string }; waiter: { fullName: string }; orderItems: OrderItem[]; status: string; createdAt: string; payment?: { amount: number } }

export default function OrdersPage() {
  const searchParams = useSearchParams()
  const tableId = searchParams.get('tableId')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('OPEN')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tableId) params.set('tableId', tableId)
      if (filter) params.set('status', filter)
      const res = await fetch(`/api/orders?${params.toString()}`)
      if (res.ok) {
        setOrders(await res.json())
      } else {
        console.error('Failed to load orders:', res.statusText)
      }
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }, [tableId, filter])

  useEffect(() => { load() }, [load])

  const statusColors: Record<string, string> = { OPEN: 'badge-open', PAID: 'badge-paid', CANCELLED: 'badge-cancelled' }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-cinzel" style={{ fontSize: '22px', fontWeight: '700' }}><span className="gold-text">Orders</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{orders.length} orders found</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
          <Link href={`/dashboard/orders/new${tableId ? `?tableId=${tableId}` : ''}`} className="btn btn-gold btn-sm">
            <Plus size={14} /> New Order
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['OPEN', 'PAID', 'CANCELLED', ''].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-gold' : 'btn-outline'}`} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <p>No orders found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map(order => {
            const total = order.orderItems.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)
            const food = order.orderItems.filter(i => i.menuItem.category?.type === 'FOOD')
            const drinks = order.orderItems.filter(i => i.menuItem.category?.type === 'DRINK')
            return (
              <div key={order.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ width: '52px', height: '52px', background: 'rgba(201,168,76,0.08)', border: '1px solid var(--gold-dark)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel,serif', fontWeight: '700', fontSize: '18px', color: 'var(--gold)', flexShrink: 0 }}>
                  {order.table.number}
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600' }}>Table {order.table.number}</span>
                    <span className={`badge ${statusColors[order.status] || ''}`}>{order.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Waiter: {order.waiter.fullName} · {new Date(order.createdAt).toLocaleString('en-ET')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {order.orderItems.length} items {food.length > 0 && `· 🍳 ${food.length} food`} {drinks.length > 0 && `· 🍹 ${drinks.length} drinks`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gold)' }}>{total.toFixed(2)} ETB</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                    <Link href={`/dashboard/orders/${order.id}`} className="btn btn-outline btn-sm"><Eye size={13} /> View</Link>
                    {order.status === 'OPEN' && (
                      <Link href={`/dashboard/payment?orderId=${order.id}`} className="btn btn-gold btn-sm">Pay</Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
