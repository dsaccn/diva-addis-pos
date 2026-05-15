'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'

interface Category { id: string; name: string; type: string }
interface Ingredient { id: string; name: string; unit: string; currentStock: number }
interface MenuItem { id: string; name: string; description?: string; price: number; available: boolean; stockQuantity: number; lowStockThreshold: number; category: Category; recipes?: any[] }

const EMPTY_FORM = { name: '', description: '', price: '', categoryId: '', available: true, stockQuantity: '0', lowStockThreshold: '5' }

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formRecipes, setFormRecipes] = useState<{ingredientId: string, quantity: string}[]>([])
  const [filterCat, setFilterCat] = useState('')
  const [showCatForm, setShowCatForm] = useState(false)
  const [catForm, setCatForm] = useState({ id: '', name: '', type: 'FOOD' })
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [itemsRes, catsRes, ingsRes] = await Promise.all([fetch('/api/menu-items'), fetch('/api/categories'), fetch('/api/ingredients')])
    setItems(await itemsRes.json())
    setCategories(await catsRes.json())
    setIngredients(await ingsRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openEdit(item: MenuItem) {
    setEditItem(item)
    setForm({ name: item.name, description: item.description || '', price: String(item.price), categoryId: item.category?.id || '', available: item.available, stockQuantity: String(item.stockQuantity), lowStockThreshold: String(item.lowStockThreshold) })
    setFormRecipes(item.recipes?.map((r: any) => ({ ingredientId: r.ingredientId, quantity: String(r.quantity) })) || [])
    setShowForm(true)
  }

  function openNew() { setEditItem(null); setForm(EMPTY_FORM); setFormRecipes([]); setShowForm(true) }

  async function saveItem() {
    setSaving(true)
    setErrorMsg('')
    const data = { 
      ...form, 
      price: parseFloat(form.price), 
      stockQuantity: parseInt(form.stockQuantity), 
      lowStockThreshold: parseInt(form.lowStockThreshold),
      recipes: formRecipes.filter(r => r.ingredientId).map(r => ({ ingredientId: r.ingredientId, quantity: parseFloat(r.quantity) }))
    }
    
    let res;
    if (editItem) {
      res = await fetch(`/api/menu-items/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    } else {
      res = await fetch('/api/menu-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    
    if (!res.ok) {
      const { error } = await res.json()
      setErrorMsg(error || 'Failed to save item')
      setSaving(false)
      return
    }

    setShowForm(false); load(); setSaving(false)
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this menu item?')) return
    setErrorMsg('')
    const res = await fetch(`/api/menu-items/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const { error } = await res.json()
      setErrorMsg(error || 'Failed to delete item')
      return
    }
    load()
  }

  async function toggleAvailable(item: MenuItem) {
    await fetch(`/api/menu-items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !item.available }) })
    load()
  }

  async function addCategory() {
    setErrorMsg('')
    let res;
    if (catForm.id) {
      res = await fetch(`/api/categories/${catForm.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: catForm.name, type: catForm.type }) })
    } else {
      res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: catForm.name, type: catForm.type }) })
    }
    if (!res.ok) {
      const { error } = await res.json()
      setErrorMsg(error || 'Failed to save category')
      return
    }
    setCatForm({ id: '', name: '', type: 'FOOD' }); load()
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category?')) return
    setErrorMsg('')
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const { error } = await res.json()
      setErrorMsg(error || 'Failed to delete category')
      return
    }
    load()
  }

  const filtered = filterCat ? items.filter(i => i.category?.id === filterCat) : items

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-cinzel" style={{ fontSize: '22px', fontWeight: '700' }}><span className="gold-text">Menu Management</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{items.length} items · {categories.length} categories</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => { setErrorMsg(''); setCatForm({ id: '', name: '', type: 'FOOD' }); setShowCatForm(true); }}><Plus size={14} /> Manage Categories</button>
          <button className="btn btn-gold btn-sm" onClick={() => { setErrorMsg(''); openNew(); }}><Plus size={14} /> Add Item</button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid var(--danger-light)', borderRadius: '8px', padding: '12px 16px', color: 'var(--danger-light)', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button className={`btn btn-sm ${!filterCat ? 'btn-gold' : 'btn-outline'}`} onClick={() => setFilterCat('')}>All</button>
        {categories.map(c => (
          <button key={c.id} className={`btn btn-sm ${filterCat === c.id ? 'btn-gold' : 'btn-outline'}`} onClick={() => setFilterCat(c.id)}>
            {c.type === 'FOOD' ? '🍽' : '🍹'} {c.name}
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--black-hover)' }}>
                {['Item', 'Category', 'Price (ETB)', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No items found.</td></tr>
              ) : filtered.map((item, i) => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--black-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.description}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {item.category?.type === 'FOOD' ? '🍽' : '🍹'} {item.category?.name || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--gold)', fontWeight: '600' }}>{item.price.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: item.stockQuantity <= item.lowStockThreshold ? 'var(--danger-light)' : 'var(--text-primary)', fontWeight: item.stockQuantity <= item.lowStockThreshold ? '700' : '400' }}>
                      {item.stockQuantity} {item.stockQuantity <= item.lowStockThreshold && '⚠'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleAvailable(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: item.available ? 'var(--success-light)' : 'var(--text-muted)', fontSize: '13px' }}>
                      {item.available ? <Eye size={14} /> : <EyeOff size={14} />}
                      {item.available ? 'Available' : 'Hidden'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-outline btn-sm" style={{ padding: '6px 10px' }} onClick={() => openEdit(item)}><Pencil size={13} /></button>
                      <button className="btn btn-danger btn-sm" style={{ padding: '6px 10px' }} onClick={() => deleteItem(item.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>{editItem ? 'Edit Item' : 'New Menu Item'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Item Name</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Tibs" />
              </div>
              <div>
                <label className="input-label">Price (ETB)</label>
                <input className="input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="input-label">Category</label>
                <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Description (optional)</label>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
              </div>
              <div>
                <label className="input-label">Stock Quantity</label>
                <input className="input" type="number" value={form.stockQuantity} onChange={e => setForm(f => ({ ...f, stockQuantity: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Low Stock Alert At</label>
                <input className="input" type="number" value={form.lowStockThreshold} onChange={e => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))} />
              </div>
              
              {/* Recipe Section */}
              <div style={{ gridColumn: '1/-1', borderTop: '1px solid var(--black-border)', paddingTop: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Recipe / Ingredients (Optional)</label>
                  <button className="btn btn-outline btn-sm" onClick={() => setFormRecipes([...formRecipes, { ingredientId: '', quantity: '1' }])}><Plus size={12}/> Add Ingredient</button>
                </div>
                {formRecipes.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No ingredients linked. Used for inventory tracking.</div>}
                {formRecipes.map((fr, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select className="input" style={{ flex: 1 }} value={fr.ingredientId} onChange={e => {
                      const newR = [...formRecipes]; newR[idx].ingredientId = e.target.value; setFormRecipes(newR);
                    }}>
                      <option value="">Select ingredient...</option>
                      {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                    </select>
                    <input className="input" style={{ width: '100px' }} type="number" step="any" placeholder="Qty" value={fr.quantity} onChange={e => {
                      const newR = [...formRecipes]; newR[idx].quantity = e.target.value; setFormRecipes(newR);
                    }} />
                    <button className="btn btn-outline btn-sm" style={{ padding: '0 10px', color: 'var(--danger-light)', borderColor: 'var(--danger-light)' }} onClick={() => {
                      const newR = [...formRecipes]; newR.splice(idx, 1); setFormRecipes(newR);
                    }}><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
              
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={saveItem} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Item'}</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCatForm && (
        <div className="modal-overlay" onClick={() => setShowCatForm(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Manage Categories</h3>
            
            {errorMsg && (
              <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid var(--danger-light)', borderRadius: '8px', padding: '12px 16px', color: 'var(--danger-light)', fontSize: '13px', marginBottom: '16px' }}>
                ⚠ {errorMsg}
              </div>
            )}

            <div style={{ marginBottom: '24px', background: 'var(--black-card)', border: '1px solid var(--black-border)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--black-border)', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Existing Categories</div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px' }}>
                {categories.length === 0 && <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>No categories yet</div>}
                {categories.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', marginBottom: '4px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{c.type === 'FOOD' ? '🍽' : '🍹'} {c.name}</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => setCatForm({ id: c.id, name: c.name, type: c.type })}><Pencil size={13} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: 'var(--danger-light)' }} onClick={() => deleteCategory(c.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--black-border)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>{catForm.id ? 'Edit Category' : 'Add New Category'}</h4>
              <div style={{ marginBottom: '12px' }}>
                <label className="input-label">Category Name</label>
                <input className="input" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Starters, Beer, Cocktails" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="input-label">Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={`btn btn-sm ${catForm.type === 'FOOD' ? 'btn-gold' : 'btn-outline'}`} onClick={() => setCatForm(f => ({ ...f, type: 'FOOD' }))}>🍽 Food</button>
                  <button className={`btn btn-sm ${catForm.type === 'DRINK' ? 'btn-gold' : 'btn-outline'}`} onClick={() => setCatForm(f => ({ ...f, type: 'DRINK' }))}>🍹 Drink</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-gold" style={{ flex: 1 }} onClick={addCategory}>{catForm.id ? 'Save Changes' : 'Add Category'}</button>
                {catForm.id && <button className="btn btn-outline" onClick={() => setCatForm({ id: '', name: '', type: 'FOOD' })}>Cancel Edit</button>}
                <button className="btn btn-ghost" onClick={() => setShowCatForm(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
