'use client'

import React, { useState } from 'react'
import { Calendar } from 'lucide-react'
import StaffMealPanel from '@/app/components/StaffMealPanel'

export default function StaffMealsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-cinzel" style={{ fontSize: '28px', fontWeight: '700', textShadow: '0 2px 10px rgba(212,175,55,0.2)' }}>
            <span className="gold-text">Staff Meals</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Auditing & Tracking Staff Meals</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--black-card)', padding: '8px', borderRadius: '12px', border: '1px solid var(--black-border)', width: '100%', maxWidth: 'max-content' }} className="mobile-width-full">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '240px' }}>
            <Calendar size={16} style={{ color: 'var(--gold)', marginLeft: '4px' }} />
            <input type="date" className="input" style={{ flex: '1', minWidth: '110px', padding: '6px 12px' }} value={from} onChange={e => setFrom(e.target.value)} />
            <span style={{ color: 'var(--text-muted)' }}>—</span>
            <input type="date" className="input" style={{ flex: '1', minWidth: '110px', padding: '6px 12px' }} value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Staff Meals List */}
      <StaffMealPanel from={from} to={to} />
    </div>
  )
}
