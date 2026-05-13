'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Printer, Plus, Minus, X, ChevronRight, AlertCircle } from 'lucide-react'

interface MenuItem { id: string; name: string; price: number; description?: string; category?: { name: string; type: string } | null }
interface Category { id: string; name: string; type: string; menuItems: MenuItem[] }
interface CartItem { menuItem: MenuItem; quantity: number; notes: string }
interface Order { id: string; table: { number: string }; waiter: { fullName: string }; orderItems: OrderItemType[]; status: string }
interface OrderItemType { id: string; menuItem: MenuItem & { category?: { name: string; type: string } | null }; quantity: number; notes?: string; status: string }

export default function NewOrderPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tableId = searchParams.get('tableId') || ''

  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [existingOrder, setExistingOrder] = useState<Order | null>(null)
  const [tableNumber, setTableNumber] = useState<string>('')
  const [session, setSession] = useState<{ id: string; fullName: string; role: string } | null>(null)
  const [noteTarget, setNoteTarget] = useState<string | null>(null)
  const [tempNote, setTempNote] = useState('')

  const loadData = useCallback(async () => {
    const [catRes, sessRes] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/auth/me'),
    ])
    const cats = await catRes.json()
    setCategories(cats)
    if (cats.length > 0) setActiveCategory(cats[0].id)
    if (sessRes.ok) setSession(await sessRes.json())

    if (tableId) {
      // Fetch the table to get its display number
      const [tableRes, ordRes] = await Promise.all([
        fetch('/api/tables'),
        fetch(`/api/orders?tableId=${tableId}&status=OPEN`),
      ])
      const tables = await tableRes.json()
      const found = tables.find((t: { id: string; number: string }) => t.id === tableId)
      if (found) setTableNumber(found.number)
      const orders = await ordRes.json()
      if (orders.length > 0) setExistingOrder(orders[0])
    }
  }, [tableId])

  useEffect(() => { loadData() }, [loadData])

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id)
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { menuItem: item, quantity: 1, notes: '' }]
    })
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(c => c.menuItem.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0))
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(c => c.menuItem.id !== id))
  }

  function saveNote(id: string) {
    setCart(prev => prev.map(c => c.menuItem.id === id ? { ...c, notes: tempNote } : c))
    setNoteTarget(null)
    setTempNote('')
  }

  const subtotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0)
  const foodItems = cart.filter(c => c.menuItem.category?.type === 'FOOD')
  const drinkItems = cart.filter(c => c.menuItem.category?.type === 'DRINK')

  function generateTicketHTML(type: 'KITCHEN' | 'BAR' | 'CASHIER', tableNumber: string, waiterName: string, items: CartItem[]) {
    const now = new Date().toLocaleString('en-ET', { timeZone: 'Africa/Addis_Ababa' })
    return `
      <div style="font-family:'Courier New',monospace;font-size:13px;width:300px;padding:16px;color:#000;background:#fff;">
        <div style="text-align:center;margin-bottom:8px;">
          <div style="font-size:16px;font-weight:bold;letter-spacing:2px;">DIVA ADDIS LOUNGE</div>
          <div style="font-size:10px;letter-spacing:1px;">Addis Ababa, Ethiopia</div>
          <hr style="border-top:1px dashed #000;margin:8px 0;"/>
          <div style="font-size:15px;font-weight:bold;border:2px solid #000;display:inline-block;padding:4px 12px;">
            ${type === 'KITCHEN' ? '🍳 KITCHEN COPY' : type === 'BAR' ? '🍹 BAR COPY' : '💰 CASHIER COPY'}
          </div>
        </div>
        <div style="margin:8px 0;">
          <div><b>Table:</b> ${tableNumber}</div>
          <div><b>Waiter:</b> ${waiterName}</div>
          <div><b>Date:</b> ${now}</div>
        </div>
        <hr style="border-top:1px dashed #000;margin:8px 0;"/>
        <div>
          ${items.map(c => `
            <div style="margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;">
                <span><b>${c.quantity}x</b> ${c.menuItem.name}</span>
                ${type === 'CASHIER' ? `<span>${(c.menuItem.price * c.quantity).toFixed(2)} ETB</span>` : ''}
              </div>
              ${c.notes ? `<div style="font-size:11px;color:#555;padding-left:12px;">Note: ${c.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <hr style="border-top:1px dashed #000;margin:8px 0;"/>
        ${type === 'CASHIER' ? `<div style="text-align:right;font-weight:bold;">SUBTOTAL: ${subtotal.toFixed(2)} ETB</div>` : ''}
        <div style="text-align:center;margin-top:8px;font-size:10px;">— Thank you —</div>
      </div>
    `
  }

  async function confirmOrder() {
    if (cart.length === 0 || !session) return
    setLoading(true)
    setOrderError('')

    let orderId = existingOrder?.id
    let tableNumber = existingOrder?.table.number || tableId

    if (!orderId) {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          waiterId: session.id,
          items: cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity, notes: c.notes })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOrderError(data.error || 'Failed to create order. Please try again.')
        setLoading(false)
        return
      }
      orderId = data.id
      tableNumber = data.table.number
    } else {
      const res = await fetch(`/api/orders/${orderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity, notes: c.notes })) }),
      })
      if (!res.ok) {
        const data = await res.json()
        setOrderError(data.error || 'Failed to add items. Please try again.')
        setLoading(false)
        return
      }
    }

    // Print tickets
    const ticketWindow = window.open('', '_blank', 'width=400,height=700')
    if (ticketWindow) {
      let ticketHTML = '<html><head><title>Tickets</title></head><body style="margin:0;padding:20px;background:#f5f5f5;">'

      if (foodItems.length > 0) {
        ticketHTML += generateTicketHTML('KITCHEN', tableNumber, session.fullName, foodItems)
        ticketHTML += '<hr style="border:2px dashed #ccc;margin:20px 0;"/>'
      }
      if (drinkItems.length > 0) {
        ticketHTML += generateTicketHTML('BAR', tableNumber, session.fullName, drinkItems)
        ticketHTML += '<hr style="border:2px dashed #ccc;margin:20px 0;"/>'
      }
      ticketHTML += generateTicketHTML('CASHIER', tableNumber, session.fullName, cart)
      ticketHTML += '</body></html>'

      ticketWindow.document.write(ticketHTML)
      ticketWindow.document.close()
      ticketWindow.focus()
      setTimeout(() => { ticketWindow.print() }, 500)
    }

    setLoading(false)
    setCart([])
    router.push('/dashboard/tables')
  }

  const activeCat = categories.find(c => c.id === activeCategory)

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 48px)' }}>
      {/* Left: Menu */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 className="font-cinzel" style={{ fontSize: '20px', fontWeight: '700' }}>
            <span className="gold-text">{existingOrder ? 'Add More Items' : 'New Order'}</span>
            {(tableNumber || tableId) && <span style={{ color: 'var(--text-secondary)', fontSize: '14px', marginLeft: '12px', fontFamily: 'Inter' }}>Table {tableNumber || tableId}</span>}
          </h1>
        </div>
        {orderError && (
          <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid var(--danger-light)', borderRadius: '8px', padding: '12px 16px', color: 'var(--danger-light)', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠ {orderError}
          </div>
        )}

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', flexShrink: 0 }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`btn btn-sm ${activeCategory === cat.id ? 'btn-gold' : 'btn-outline'}`}
              onClick={() => setActiveCategory(cat.id)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {cat.type === 'FOOD' ? '🍽' : '🍹'} {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
            {activeCat?.menuItems.map(item => {
              const inCart = cart.find(c => c.menuItem.id === item.id)
              return (
                <div
                  key={item.id}
                  className="card card-hover"
                  onClick={() => addToCart(item)}
                  style={{
                    padding: '16px',
                    border: inCart ? '1px solid var(--gold-dark)' : '1px solid var(--black-border)',
                    background: inCart ? 'rgba(201,168,76,0.06)' : 'var(--black-card)',
                    position: 'relative',
                  }}
                >
                  {inCart && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--gold)', color: 'var(--black)', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                      {inCart.quantity}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', paddingRight: '24px' }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{item.description}</div>}
                  <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: '600' }}>{item.price.toFixed(2)} ETB</div>
                </div>
              )
            })}
            {activeCat?.menuItems.length === 0 && (
              <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1' }}>No items in this category.</p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--black-card)', border: '1px solid var(--black-border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--black-border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600' }}>New Items to Add</h2>
          {existingOrder && (
            <div style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '4px' }}>
              ✦ Table {tableNumber} already has {existingOrder.orderItems.filter((i: OrderItemType) => i.status !== 'CANCELLED').length} item(s) ordered
            </div>
          )}
        </div>

        {/* Already ordered summary */}
        {existingOrder && existingOrder.orderItems.filter((i: OrderItemType) => i.status !== 'CANCELLED').length > 0 && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--black-border)', background: 'rgba(201,168,76,0.03)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Already Ordered</div>
            {existingOrder.orderItems.filter((i: OrderItemType) => i.status !== 'CANCELLED').map((i: OrderItemType) => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                <span>{i.quantity}x {i.menuItem.name}</span>
                <span style={{ color: i.status === 'PRINTED' ? 'var(--success-light)' : 'var(--text-muted)', fontSize: '10px' }}>{i.status}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
              <p style={{ fontSize: '13px' }}>Tap items to add to cart</p>
            </div>
          ) : (
            cart.map(c => (
              <div key={c.menuItem.id} style={{ marginBottom: '10px', padding: '10px', background: 'var(--black-hover)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px', width: '28px', height: '28px' }} onClick={() => updateQty(c.menuItem.id, -1)}><Minus size={13} /></button>
                  <span style={{ fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>{c.quantity}</span>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px', width: '28px', height: '28px' }} onClick={() => updateQty(c.menuItem.id, 1)}><Plus size={13} /></button>
                  <div style={{ flex: 1, fontSize: '13px' }}>{c.menuItem.name}</div>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px', color: 'var(--danger-light)' }} onClick={() => removeFromCart(c.menuItem.id)}><X size={13} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingLeft: '4px' }}>
                  <button style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => { setNoteTarget(c.menuItem.id); setTempNote(c.notes) }}>
                    <AlertCircle size={11} /> {c.notes || 'Add note'}
                  </button>
                  <span style={{ fontSize: '13px', color: 'var(--gold)' }}>{(c.menuItem.price * c.quantity).toFixed(2)} ETB</span>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--black-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--gold)' }}>{subtotal.toFixed(2)} ETB</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', gap: '16px' }}>
              {foodItems.length > 0 && <span>🍳 Kitchen ticket</span>}
              {drinkItems.length > 0 && <span>🍹 Bar ticket</span>}
              <span>💰 Cashier copy</span>
            </div>
            <button className="btn btn-gold" style={{ width: '100%', fontSize: '15px', padding: '14px' }} onClick={confirmOrder} disabled={loading}>
              <Printer size={17} />
              {loading ? 'Printing...' : 'Confirm & Print Tickets'}
            </button>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '8px' }} onClick={() => setCart([])}>Clear Cart</button>
          </div>
        )}
      </div>

      {/* Note Modal */}
      {noteTarget && (
        <div className="modal-overlay" onClick={() => setNoteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Add Special Note</h3>
            <input className="input" placeholder="e.g. No onions, well done..." value={tempNote} onChange={e => setTempNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveNote(noteTarget!)} autoFocus />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => saveNote(noteTarget!)}>Save Note</button>
              <button className="btn btn-ghost" onClick={() => setNoteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
