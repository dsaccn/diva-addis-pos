'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react'

interface Staff { id: string; username: string; fullName: string; role: string; phone?: string; active: boolean }

const ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']
const EMPTY = { username: '', fullName: '', password: '', role: 'WAITER', phone: '' }

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editStaff, setEditStaff] = useState<Staff | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/staff')
      if (res.ok) {
        setStaff(await res.json())
      } else {
        console.error('Failed to load staff:', res.statusText)
      }
    } catch (err) {
      console.error('Error loading staff:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() { setEditStaff(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(s: Staff) { setEditStaff(s); setForm({ username: s.username, fullName: s.fullName, password: '', role: s.role, phone: s.phone || '' }); setShowForm(true) }

  async function save() {
    setSaving(true)
    if (editStaff) {
      await fetch(`/api/staff/${editStaff.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setShowForm(false); load(); setSaving(false)
  }

  async function toggleActive(s: Staff) {
    await fetch(`/api/staff/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !s.active }) })
    load()
  }

  const roleColors: Record<string, string> = { ADMIN: 'var(--gold)', MANAGER: 'var(--warning-light)', CASHIER: 'var(--success-light)', WAITER: 'var(--text-secondary)' }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-cinzel" style={{ fontSize: '22px', fontWeight: '700' }}><span className="gold-text">Staff Management</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{staff.filter(s => s.active).length} active · {staff.filter(s => !s.active).length} inactive</p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={openNew}><Plus size={14} /> Add Staff</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : staff.map(s => (
          <div key={s.id} className="card" style={{ opacity: s.active ? 1 : 0.5, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '1px solid var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: 'var(--gold)', flexShrink: 0 }}>
                  {s.fullName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '600' }}>{s.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{s.username}</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: `${roleColors[s.role]}22`, color: roleColors[s.role], fontWeight: '600', border: `1px solid ${roleColors[s.role]}44`, whiteSpace: 'nowrap' }}>
                {s.role}
              </span>
            </div>
            {s.phone && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>📞 {s.phone}</div>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(s)}><Pencil size={13} /> Edit</button>
              <button className={`btn btn-sm ${s.active ? 'btn-danger' : 'btn-success'}`} style={{ flex: 1 }} onClick={() => toggleActive(s)}>
                {s.active ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>{editStaff ? 'Edit Staff' : 'Add New Staff'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Full Name</label>
                <input className="input" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Abebe Bekele" autoFocus />
              </div>
              <div>
                <label className="input-label">Username</label>
                <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="e.g. abebe123" />
              </div>
              <div>
                <label className="input-label">{editStaff ? 'New Password (leave blank)' : 'Password'}</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </div>
              <div>
                <label className="input-label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Phone</label>
                <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+251..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? 'Saving...' : editStaff ? 'Save Changes' : 'Add Staff'}</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
