'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Plus, Minus, Pencil, Trash2, RefreshCw } from 'lucide-react'

interface MenuItem { id: string; name: string; price: number; stockQuantity: number; lowStockThreshold: number; available: boolean; category?: { name: string; type: string } | null }
interface Ingredient { id: string; name: string; unit: string; quantity: number; minThreshold: number }

const UNITS = ['grams', 'kg', 'ml', 'liters', 'pieces', 'cups', 'tbsp', 'tsp']

export default function InventoryPage() {
  const [tab, setTab] = useState<'drinks' | 'ingredients'>('drinks')

  // Drink stock state
  const [items, setItems] = useState<MenuItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [adjustTarget, setAdjustTarget] = useState<MenuItem | null>(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'drinks'>('all')

  // Ingredient state
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loadingIngs, setLoadingIngs] = useState(true)
  const [editIng, setEditIng] = useState<Ingredient | null>(null)
  const [ingForm, setIngForm] = useState({ name: '', unit: 'grams', quantity: '0', minThreshold: '0' })
  const [showIngForm, setShowIngForm] = useState(false)
  const [ingError, setIngError] = useState('')

  const loadItems = useCallback(async () => {
    setLoadingItems(true)
    const res = await fetch('/api/menu-items')
    setItems(await res.json())
    setLoadingItems(false)
  }, [])

  const loadIngredients = useCallback(async () => {
    setLoadingIngs(true)
    const res = await fetch('/api/ingredients')
    setIngredients(await res.json())
    setLoadingIngs(false)
  }, [])

  useEffect(() => { loadItems(); loadIngredients() }, [loadItems, loadIngredients])

  // Drink stock functions
  async function adjustStock(delta: number) {
    setAdjustQty(prev => String(Math.max(0, parseInt(prev || '0') + delta)))
  }

  async function setStockDirect() {
    if (!adjustTarget || !adjustQty) return
    await fetch(`/api/menu-items/${adjustTarget.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockQuantity: parseInt(adjustQty) }),
    })
    setAdjustTarget(null); setAdjustQty(''); loadItems()
  }

  // Ingredient functions
  function openNewIng() {
    setEditIng(null)
    setIngForm({ name: '', unit: 'grams', quantity: '0', minThreshold: '0' })
    setIngError('')
    setShowIngForm(true)
  }

  function openEditIng(ing: Ingredient) {
    setEditIng(ing)
    setIngForm({ name: ing.name, unit: ing.unit, quantity: String(ing.quantity), minThreshold: String(ing.minThreshold) })
    setIngError('')
    setShowIngForm(true)
  }

  async function saveIngredient() {
    setIngError('')
    const body = { name: ingForm.name.trim(), unit: ingForm.unit, quantity: parseFloat(ingForm.quantity), minThreshold: parseFloat(ingForm.minThreshold) }
    let res
    if (editIng) {
      res = await fetch(`/api/ingredients/${editIng.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      res = await fetch('/api/ingredients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    if (!res.ok) {
      const { error } = await res.json()
      setIngError(error || 'Failed to save')
      return
    }
    setShowIngForm(false)
    loadIngredients()
  }

  async function deleteIngredient(id: string) {
    if (!confirm('Delete this ingredient? It will also be removed from all recipes.')) return
    await fetch(`/api/ingredients/${id}`, { method: 'DELETE' })
    loadIngredients()
  }

  const filtered = items.filter(i => {
    if (filter === 'low') return i.stockQuantity <= i.lowStockThreshold
    if (filter === 'drinks') return i.category?.type === 'DRINK'
    return true
  })

  const lowDrinkCount = items.filter(i => i.stockQuantity <= i.lowStockThreshold).length
  const lowIngCount = ingredients.filter(i => i.quantity <= i.minThreshold).length

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-cinzel" style={{ fontSize: '22px', fontWeight: '700' }}><span className="gold-text">Inventory</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {lowDrinkCount + lowIngCount > 0 && <span style={{ color: 'var(--danger-light)', marginRight: '8px' }}>⚠ {lowDrinkCount + lowIngCount} low stock</span>}
            {items.length} products · {ingredients.length} ingredients
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { loadItems(); loadIngredients() }}><RefreshCw size={14} /> Refresh</button>
          {tab === 'ingredients' && <button className="btn btn-gold btn-sm" onClick={openNewIng}><Plus size={14} /> Add Ingredient</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--black-border)', paddingBottom: '0' }}>
        {([['drinks', '🍹 Drink Stock'], ['ingredients', '🥩 Ingredients']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 20px', fontSize: '14px', fontWeight: '600',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === key ? '2px solid var(--gold)' : '2px solid transparent',
              color: tab === key ? 'var(--gold)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            {label}
            {key === 'drinks' && lowDrinkCount > 0 && <span style={{ marginLeft: '6px', background: 'var(--danger-light)', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>{lowDrinkCount}</span>}
            {key === 'ingredients' && lowIngCount > 0 && <span style={{ marginLeft: '6px', background: 'var(--danger-light)', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>{lowIngCount}</span>}
          </button>
        ))}
      </div>

      {/* ── DRINK STOCK TAB ── */}
      {tab === 'drinks' && (
        <>
          {lowDrinkCount > 0 && (
            <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid var(--danger-light)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={20} color="var(--danger-light)" />
              <div>
                <div style={{ fontWeight: '600', color: 'var(--danger-light)' }}>{lowDrinkCount} item{lowDrinkCount > 1 ? 's' : ''} running low!</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Click the item to restock.</div>
              </div>
              <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto', borderColor: 'var(--danger-light)', color: 'var(--danger-light)' }} onClick={() => setFilter('low')}>View Low Stock</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {(['all', 'drinks', 'low'] as const).map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-gold' : 'btn-outline'}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All Items' : f === 'drinks' ? '🍹 Drinks Only' : '⚠ Low Stock'}
              </button>
            ))}
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--black-hover)' }}>
                    {['Item', 'Category', 'In Stock', 'Low Alert At', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingItems ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No items found.</td></tr>
                  ) : filtered.map(item => {
                    const isLow = item.stockQuantity <= item.lowStockThreshold
                    return (
                      <tr key={item.id} style={{ borderTop: '1px solid var(--black-border)', background: isLow ? 'rgba(230,57,70,0.03)' : 'transparent' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{item.category?.type === 'FOOD' ? '🍽' : '🍹'} {item.category?.name}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ fontWeight: '700', fontSize: '16px', color: isLow ? 'var(--danger-light)' : 'var(--success-light)' }}>{item.stockQuantity}</span></td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{item.lowStockThreshold}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {isLow ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--danger-light)', background: 'rgba(230,57,70,0.1)', padding: '3px 8px', borderRadius: '8px', fontWeight: '600' }}>
                              <AlertTriangle size={11} /> LOW STOCK
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--success-light)', background: 'rgba(82,183,136,0.1)', padding: '3px 8px', borderRadius: '8px' }}>OK</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => { setAdjustTarget(item); setAdjustQty(String(item.stockQuantity)) }}>Update Stock</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── INGREDIENTS TAB ── */}
      {tab === 'ingredients' && (
        <>
          {lowIngCount > 0 && (
            <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid var(--danger-light)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={20} color="var(--danger-light)" />
              <div>
                <div style={{ fontWeight: '600', color: 'var(--danger-light)' }}>{lowIngCount} ingredient{lowIngCount > 1 ? 's' : ''} running low!</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Restock before serving affected dishes.</div>
              </div>
            </div>
          )}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--black-hover)' }}>
                    {['Ingredient', 'Unit', 'In Stock', 'Min Threshold', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingIngs ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
                  ) : ingredients.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No ingredients yet. Click <strong>Add Ingredient</strong> to start.
                    </td></tr>
                  ) : ingredients.map(ing => {
                    const isLow = ing.quantity <= ing.minThreshold
                    return (
                      <tr key={ing.id} style={{ borderTop: '1px solid var(--black-border)', background: isLow ? 'rgba(230,57,70,0.03)' : 'transparent' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                          {isLow && <span style={{ color: 'var(--danger-light)', marginRight: '6px' }}>⚠</span>}
                          {ing.name}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{ing.unit}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: '700', fontSize: '16px', color: isLow ? 'var(--danger-light)' : 'var(--success-light)' }}>
                            {ing.quantity}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{ing.minThreshold}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {isLow ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--danger-light)', background: 'rgba(230,57,70,0.1)', padding: '3px 8px', borderRadius: '8px', fontWeight: '600' }}>
                              <AlertTriangle size={11} /> LOW
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--success-light)', background: 'rgba(82,183,136,0.1)', padding: '3px 8px', borderRadius: '8px' }}>OK</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-outline btn-sm" style={{ padding: '6px 10px' }} onClick={() => openEditIng(ing)}><Pencil size={13} /></button>
                            <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px', color: 'var(--danger-light)' }} onClick={() => deleteIngredient(ing.id)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Drink Stock Adjust Modal */}
      {adjustTarget && (
        <div className="modal-overlay" onClick={() => setAdjustTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Update Stock</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>{adjustTarget.name} — Current: <b style={{ color: 'var(--gold)' }}>{adjustTarget.stockQuantity}</b></p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => adjustStock(-1)}><Minus size={16} /></button>
              <input className="input" type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} style={{ width: '100px', textAlign: 'center', fontSize: '20px', fontWeight: '700' }} />
              <button className="btn btn-outline" onClick={() => adjustStock(1)}><Plus size={16} /></button>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={setStockDirect}>Set to {adjustQty}</button>
              <button className="btn btn-ghost" onClick={() => setAdjustTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Add/Edit Modal */}
      {showIngForm && (
        <div className="modal-overlay" onClick={() => setShowIngForm(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>{editIng ? 'Edit Ingredient' : 'New Ingredient'}</h3>
            {ingError && (
              <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid var(--danger-light)', borderRadius: '8px', padding: '10px 14px', color: 'var(--danger-light)', fontSize: '13px', marginBottom: '16px' }}>⚠ {ingError}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Name</label>
                <input className="input" placeholder="e.g. Beef, Tomato, Onion" value={ingForm.name} onChange={e => setIngForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="input-label">Unit</label>
                <select className="input" value={ingForm.unit} onChange={e => setIngForm(f => ({ ...f, unit: e.target.value }))}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Current Stock</label>
                <input className="input" type="number" value={ingForm.quantity} onChange={e => setIngForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Low Stock Alert At</label>
                <input className="input" type="number" value={ingForm.minThreshold} onChange={e => setIngForm(f => ({ ...f, minThreshold: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={saveIngredient}>{editIng ? 'Save Changes' : 'Add Ingredient'}</button>
              <button className="btn btn-ghost" onClick={() => setShowIngForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
