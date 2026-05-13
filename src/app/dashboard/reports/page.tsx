'use client'

import { useEffect, useState, useCallback } from 'react'
import { Printer, RefreshCw } from 'lucide-react'

interface ReportData {
  totalRevenue: number
  totalOrders: number
  revenueByMethod: Record<string, number>
  bestSelling: { name: string; category: string; quantity: number; revenue: number }[]
  staffPerformance: { name: string; orders: number; revenue: number }[]
  cancellations: { id: string; orderItem: { menuItem: { name: string }; quantity: number; order: { table: { number: string }; waiter: { fullName: string } } }; manager: { fullName: string }; reason: string; createdAt: string }[]
  lowStock: { id: string; name: string; stockQuantity: number; lowStockThreshold: number }[]
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [activeTab, setActiveTab] = useState('summary')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const res = await fetch(`/api/reports?${params.toString()}`)
    setData(await res.json())
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  function printReport() { window.print() }

  const tabs = ['summary', 'best-sellers', 'staff', 'cancellations', 'inventory']

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading reports...</div>
  if (!data) return null

  return (
    <div className="animate-fade-in no-print">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-cinzel" style={{ fontSize: '22px', fontWeight: '700' }}><span className="gold-text">Reports & Analytics</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Diva Addis Lounge Business Intelligence</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /></button>
          <button className="btn btn-outline btn-sm" onClick={printReport}><Printer size={14} /> Print</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.03))' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Total Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--gold)' }}>{data.totalRevenue.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>ETB</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Paid Orders</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>{data.totalOrders}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>orders</div>
        </div>
        <div className="card" style={{ background: 'rgba(230,57,70,0.05)', border: '1px solid rgba(230,57,70,0.2)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Cancellations</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--danger-light)' }}>{data.cancellations.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>items cancelled</div>
        </div>
        <div className="card" style={{ background: data.lowStock.length > 0 ? 'rgba(230,57,70,0.05)' : 'rgba(82,183,136,0.05)', border: `1px solid ${data.lowStock.length > 0 ? 'rgba(230,57,70,0.2)' : 'rgba(82,183,136,0.2)'}` }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Low Stock Items</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: data.lowStock.length > 0 ? 'var(--danger-light)' : 'var(--success-light)' }}>{data.lowStock.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>need restocking</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map(t => (
          <button key={t} className={`btn btn-sm ${activeTab === t ? 'btn-gold' : 'btn-outline'}`} onClick={() => setActiveTab(t)} style={{ whiteSpace: 'nowrap' }}>
            {t === 'summary' ? '📊 Revenue' : t === 'best-sellers' ? '🏆 Best Sellers' : t === 'staff' ? '👤 Staff' : t === 'cancellations' ? '❌ Cancellations' : '📦 Inventory'}
          </button>
        ))}
      </div>

      {/* Revenue by Method */}
      {activeTab === 'summary' && (
        <div className="card">
          <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Revenue by Payment Method</h3>
          {Object.entries(data.revenueByMethod).map(([method, amount]) => {
            const pct = data.totalRevenue > 0 ? (amount / data.totalRevenue) * 100 : 0
            return (
              <div key={method} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{method}</span>
                  <span style={{ fontWeight: '600', color: 'var(--gold)' }}>{amount.toFixed(2)} ETB <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({pct.toFixed(1)}%)</span></span>
                </div>
                <div style={{ height: '6px', background: 'var(--black-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )
          })}
          {Object.keys(data.revenueByMethod).length === 0 && <p style={{ color: 'var(--text-muted)' }}>No payment data yet.</p>}
        </div>
      )}

      {/* Best Selling */}
      {activeTab === 'best-sellers' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--black-hover)' }}>
                {['#', 'Item', 'Category', 'Qty Sold', 'Revenue (ETB)'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.bestSelling.map((item, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--black-border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--gold)', fontWeight: '700' }}>#{i + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{item.category}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700' }}>{item.quantity}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--gold)', fontWeight: '600' }}>{item.revenue.toFixed(2)}</td>
                </tr>
              ))}
              {data.bestSelling.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Performance */}
      {activeTab === 'staff' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--black-hover)' }}>
                {['Staff Member', 'Orders', 'Revenue (ETB)'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.staffPerformance.sort((a, b) => b.revenue - a.revenue).map((s, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--black-border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{s.name}</td>
                  <td style={{ padding: '12px 16px' }}>{s.orders}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--gold)', fontWeight: '600' }}>{s.revenue.toFixed(2)}</td>
                </tr>
              ))}
              {data.staffPerformance.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancellations */}
      {activeTab === 'cancellations' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--black-hover)' }}>
                {['Item', 'Table', 'Waiter', 'Reason', 'Approved By', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cancellations.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--black-border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{c.orderItem.quantity}x {c.orderItem.menuItem.name}</td>
                  <td style={{ padding: '12px 16px' }}>{c.orderItem.order.table.number}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.orderItem.order.waiter.fullName}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.reason}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--warning-light)' }}>{c.manager.fullName}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString('en-ET')}</td>
                </tr>
              ))}
              {data.cancellations.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No cancellations.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Inventory */}
      {activeTab === 'inventory' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--black-hover)' }}>
                {['Item', 'In Stock', 'Alert Level', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.lowStock.map(item => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--black-border)', background: 'rgba(230,57,70,0.03)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--danger-light)', fontWeight: '700' }}>{item.stockQuantity}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{item.lowStockThreshold}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '12px', color: 'var(--danger-light)', background: 'rgba(230,57,70,0.1)', padding: '3px 8px', borderRadius: '8px' }}>⚠ LOW</span></td>
                </tr>
              ))}
              {data.lowStock.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--success-light)' }}>✓ All items have sufficient stock.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
