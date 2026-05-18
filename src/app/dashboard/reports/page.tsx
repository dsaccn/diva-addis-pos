'use client'

import { useEffect, useState, useCallback } from 'react'
import { Printer, RefreshCw, TrendingUp, DollarSign, ShoppingBag, XCircle, AlertTriangle } from 'lucide-react'

interface ReportData {
  totalRevenue: number
  totalOrders: number
  revenueByMethod: Record<string, number>
  bestSelling: { name: string; category: string; quantity: number; revenue: number }[]
  staffPerformance: { name: string; orders: number; revenue: number }[]
  cancellations: { id: string; orderItem: { menuItem: { name: string }; quantity: number; order: { table: { number: string }; waiter: { fullName: string } } }; manager: { fullName: string }; reason: string; createdAt: string }[]
  lowStock: { id: string; name: string; stockQuantity: number; lowStockThreshold: number }[]
  transactions: { id: string; date: string; amount: number; method: string; cashier: string; waiter: string; table: string; items: string }[]
  dailySales: { date: string; orders: number; revenue: number }[]
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

  const tabs = [
    { id: 'summary', label: 'Dashboard', icon: <TrendingUp size={14}/> },
    { id: 'daily', label: 'Daily Sales', icon: <DollarSign size={14}/> },
    { id: 'history', label: 'Transaction History', icon: <ShoppingBag size={14}/> },
    { id: 'best-sellers', label: 'Best Sellers', icon: <TrendingUp size={14}/> },
    { id: 'staff', label: 'Staff Performance', icon: <TrendingUp size={14}/> },
    { id: 'cancellations', label: 'Cancellations', icon: <XCircle size={14}/> },
    { id: 'inventory', label: 'Low Stock', icon: <AlertTriangle size={14}/> }
  ]

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--gold)' }}>
      <RefreshCw className="animate-spin" size={40} style={{ marginBottom: '16px' }} />
      <div className="font-cinzel" style={{ fontSize: '18px' }}>Gathering Intelligence...</div>
    </div>
  )
  
  if (!data) return null

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount)
  }

  const avgOrderValue = data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0

  // Colors for charts
  const methodColors = ['#D4AF37', '#52B788', '#F4A261', '#E63946', '#4A4E69']

  return (
    <div className="animate-fade-in no-print" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-cinzel" style={{ fontSize: '28px', fontWeight: '700', textShadow: '0 2px 10px rgba(212,175,55,0.2)' }}>
            <span className="gold-text">Business Intelligence</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Advanced Analytics & Reporting</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--black-card)', padding: '8px', borderRadius: '12px', border: '1px solid var(--black-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="date" className="input" style={{ width: '140px', padding: '6px 12px' }} value={from} onChange={e => setFrom(e.target.value)} />
            <span style={{ color: 'var(--text-muted)' }}>—</span>
            <input type="date" className="input" style={{ width: '140px', padding: '6px 12px' }} value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--black-border)', margin: '0 4px' }} />
          <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh"><RefreshCw size={16} /></button>
          <button className="btn btn-gold btn-sm" onClick={printReport}><Printer size={16} /> Print</button>
        </div>
      </div>

      {/* Advanced KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.02) 100%)', border: '1px solid rgba(212,175,55,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>Total Revenue</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{formatMoney(data.totalRevenue)}</div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(212,175,55,0.2)', borderRadius: '12px', color: 'var(--gold)' }}><DollarSign size={24}/></div>
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(82,183,136,0.15) 0%, rgba(82,183,136,0.02) 100%)', border: '1px solid rgba(82,183,136,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--success-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>Completed Orders</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)' }}>{data.totalOrders}</div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(82,183,136,0.2)', borderRadius: '12px', color: 'var(--success-light)' }}><ShoppingBag size={24}/></div>
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(244,162,97,0.15) 0%, rgba(244,162,97,0.02) 100%)', border: '1px solid rgba(244,162,97,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--warning-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>Average Order Value</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatMoney(avgOrderValue)}</div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(244,162,97,0.2)', borderRadius: '12px', color: 'var(--warning-light)' }}><TrendingUp size={24}/></div>
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.15) 0%, rgba(230,57,70,0.02) 100%)', border: '1px solid rgba(230,57,70,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--danger-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>Cancellations</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)' }}>{data.cancellations.length}</div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(230,57,70,0.2)', borderRadius: '12px', color: 'var(--danger-light)' }}><XCircle size={24}/></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--black-border)' }}>
        {tabs.map(t => (
          <button key={t.id} className={`btn btn-sm ${activeTab === t.id ? 'btn-gold' : 'btn-ghost'}`} style={{ whiteSpace: 'nowrap', borderRadius: '8px 8px 0 0', borderBottom: activeTab === t.id ? '2px solid var(--gold)' : '2px solid transparent', padding: '10px 16px' }} onClick={() => setActiveTab(t.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {t.icon}
              <span style={{ fontWeight: activeTab === t.id ? '600' : '400' }}>{t.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Advanced Summary Dashboard */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          
          {/* Daily Sales Bar Chart (CSS) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--gold)" /> Daily Revenue Trends
            </h3>
            {data.dailySales.length > 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', height: '250px', padding: '20px 0 0', borderBottom: '1px solid var(--black-border)' }}>
                {data.dailySales.slice(0, 14).reverse().map((day, i) => {
                  const maxRev = Math.max(...data.dailySales.map(d => d.revenue))
                  const heightPct = Math.max((day.revenue / maxRev) * 100, 5)
                  return (
                    <div key={i} className="group" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '-30px', background: 'var(--black-card)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid var(--gold)', opacity: 0, transition: 'opacity 0.2s' }} className="hover-tooltip">
                        {formatMoney(day.revenue)}
                      </div>
                      <div style={{ width: '100%', height: `${heightPct}%`, background: 'linear-gradient(to top, rgba(212,175,55,0.2), rgba(212,175,55,0.8))', borderRadius: '4px 4px 0 0', cursor: 'pointer', transition: 'all 0.3s' }} className="bar-hover" title={`${new Date(day.date).toLocaleDateString()} - ${formatMoney(day.revenue)}`} />
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                        {new Date(day.date).getDate()}/{new Date(day.date).getMonth()+1}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No daily sales data available.</div>
            )}
            <style dangerouslySetInnerHTML={{__html: `
              .bar-hover:hover { filter: brightness(1.3); }
              .bar-hover:hover + .hover-tooltip { opacity: 1; }
            `}} />
          </div>

          {/* Payment Method Donut Chart */}
          <div className="card">
            <h3 style={{ fontWeight: '600', marginBottom: '24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--gold)" /> Revenue by Method
            </h3>
            
            {Object.keys(data.revenueByMethod).length > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', position: 'relative' }}>
                  {/* CSS Donut Chart */}
                  <div style={{ width: '180px', height: '180px', borderRadius: '50%', position: 'relative', background: (() => {
                    let acc = 0;
                    const segments = Object.entries(data.revenueByMethod).map(([method, amt], i) => {
                      const pct = (amt / data.totalRevenue) * 100;
                      const start = acc;
                      acc += pct;
                      return `${methodColors[i % methodColors.length]} ${start}% ${acc}%`;
                    }).join(', ');
                    return `conic-gradient(${segments})`;
                  })() }}>
                    {/* Inner hole for donut */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '110px', height: '110px', background: 'var(--black-card)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total</span>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gold)' }}>{data.totalRevenue > 9999 ? (data.totalRevenue/1000).toFixed(1)+'k' : data.totalRevenue.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(data.revenueByMethod).map(([method, amount], i) => {
                    const pct = data.totalRevenue > 0 ? (amount / data.totalRevenue) * 100 : 0
                    return (
                      <div key={method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: methodColors[i % methodColors.length] }} />
                          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{method}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>{formatMoney(amount)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pct.toFixed(1)}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>No payment data yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Advanced Tables Helper Component */}
      {(() => {
        const renderTable = (columns: string[], dataRenderer: () => React.ReactNode, emptyMessage: string, isEmpty: boolean) => (
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--black-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--black-border)' }}>
                    {columns.map(h => (
                      <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isEmpty ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>{emptyMessage}</td></tr> : dataRenderer()}
                </tbody>
              </table>
            </div>
          </div>
        );

        if (activeTab === 'daily') return renderTable(
          ['Date', 'Total Orders', 'Revenue (ETB)', 'Avg Order Value'],
          () => data.dailySales.map((day, i) => (
            <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--black-border)' }}>
              <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-primary)' }}>{new Date(day.date).toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              <td style={{ padding: '16px 20px' }}><span className="badge badge-outline">{day.orders}</span></td>
              <td style={{ padding: '16px 20px', color: 'var(--gold)', fontWeight: '700', fontSize: '15px' }}>{formatMoney(day.revenue)}</td>
              <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{day.orders > 0 ? formatMoney(day.revenue / day.orders) : '-'}</td>
            </tr>
          )),
          'No daily sales data available.', data.dailySales.length === 0
        )

        if (activeTab === 'history') return renderTable(
          ['Date & Time', 'Table', 'Served By', 'Items Ordered', 'Method', 'Total Paid'],
          () => data.transactions.map((tx) => (
            <tr key={tx.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--black-border)' }}>
              <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(tx.date).toLocaleString('en-ET', { dateStyle: 'medium', timeStyle: 'short' })}</td>
              <td style={{ padding: '16px 20px', fontWeight: '700' }}>Table {tx.table}</td>
              <td style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{tx.waiter}</div>
                <div style={{ fontSize: '11px', color: 'var(--gold)' }}>Cashier: {tx.cashier}</div>
              </td>
              <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '250px', lineHeight: '1.5' }}>
                {tx.items.split(', ').map((it, idx) => <div key={idx}>• {it}</div>)}
              </td>
              <td style={{ padding: '16px 20px' }}><span className={`badge ${tx.method === 'Cash' ? 'badge-success' : 'badge-occupied'}`}>{tx.method}</span></td>
              <td style={{ padding: '16px 20px', color: 'var(--gold)', fontWeight: '700', fontSize: '15px' }}>{formatMoney(tx.amount)}</td>
            </tr>
          )),
          'No transactions found.', data.transactions.length === 0
        )

        if (activeTab === 'best-sellers') return renderTable(
          ['Rank', 'Item Name', 'Category', 'Units Sold', 'Revenue Generated'],
          () => data.bestSelling.map((item, i) => (
            <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--black-border)' }}>
              <td style={{ padding: '16px 20px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i < 3 ? 'var(--gold)' : 'var(--black-hover)', color: i < 3 ? 'var(--black)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' }}>
                  {i + 1}
                </div>
              </td>
              <td style={{ padding: '16px 20px', fontWeight: '600', fontSize: '15px' }}>{item.name}</td>
              <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{item.category}</td>
              <td style={{ padding: '16px 20px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.quantity}</td>
              <td style={{ padding: '16px 20px', color: 'var(--gold)', fontWeight: '700' }}>{formatMoney(item.revenue)}</td>
            </tr>
          )),
          'No items sold yet.', data.bestSelling.length === 0
        )

        if (activeTab === 'staff') return renderTable(
          ['Staff Member', 'Orders Handled', 'Total Revenue'],
          () => data.staffPerformance.sort((a, b) => b.revenue - a.revenue).map((s, i) => (
            <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--black-border)' }}>
              <td style={{ padding: '16px 20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(212,175,55,0.2)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                  {s.name.charAt(0)}
                </div>
                {s.name}
              </td>
              <td style={{ padding: '16px 20px' }}><span className="badge badge-outline">{s.orders}</span></td>
              <td style={{ padding: '16px 20px', color: 'var(--gold)', fontWeight: '700', fontSize: '15px' }}>{formatMoney(s.revenue)}</td>
            </tr>
          )),
          'No staff performance data.', data.staffPerformance.length === 0
        )

        if (activeTab === 'cancellations') return renderTable(
          ['Item Cancelled', 'Order Info', 'Reason', 'Authorized By', 'Date & Time'],
          () => data.cancellations.map(c => (
            <tr key={c.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--black-border)' }}>
              <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--danger-light)' }}>{c.orderItem.quantity}x {c.orderItem.menuItem.name}</td>
              <td style={{ padding: '16px 20px', fontSize: '13px' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Table {c.orderItem.order.table.number}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Waiter: {c.orderItem.order.waiter.fullName}</div>
              </td>
              <td style={{ padding: '16px 20px', fontSize: '13px', fontStyle: 'italic', color: 'var(--text-muted)' }}>"{c.reason}"</td>
              <td style={{ padding: '16px 20px' }}><span className="badge badge-waiting">{c.manager.fullName}</span></td>
              <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleString('en-ET', { dateStyle: 'medium', timeStyle: 'short' })}</td>
            </tr>
          )),
          'No cancellations recorded.', data.cancellations.length === 0
        )

        if (activeTab === 'inventory') return renderTable(
          ['Item Name', 'Current Stock', 'Alert Threshold', 'Status'],
          () => data.lowStock.map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid var(--black-border)', background: 'rgba(230,57,70,0.03)' }}>
              <td style={{ padding: '16px 20px', fontWeight: '600' }}>{item.name}</td>
              <td style={{ padding: '16px 20px', color: 'var(--danger-light)', fontWeight: '700', fontSize: '16px' }}>{item.stockQuantity}</td>
              <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{item.lowStockThreshold}</td>
              <td style={{ padding: '16px 20px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--danger-light)', background: 'rgba(230,57,70,0.1)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', letterSpacing: '1px' }}>
                  <AlertTriangle size={12}/> LOW STOCK
                </span>
              </td>
            </tr>
          )),
          '✅ All items have sufficient stock.', data.lowStock.length === 0
        )

        return null;
      })()}

      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover { transition: background 0.2s; }
        .table-row-hover:hover { background: rgba(255,255,255,0.02); }
      `}} />
    </div>
  )
}
