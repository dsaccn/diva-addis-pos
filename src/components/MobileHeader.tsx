'use client'

import { Menu, X } from 'lucide-react'

interface MobileHeaderProps {
  isOpen: boolean
  onToggle: () => void
}

export default function MobileHeader({ isOpen, onToggle }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      {/* Logo */}
      <div className="mobile-header-logo">
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '1.5px solid var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(201,168,76,0.07)', flexShrink: 0,
        }}>
          <span style={{ fontSize: '13px' }}>✦</span>
        </div>
        <div>
          <div className="font-cinzel gold-text" style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', lineHeight: 1.2 }}>
            DIVA ADDIS
          </div>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '2px' }}>LOUNGE</div>
        </div>
      </div>

      {/* Hamburger / Close */}
      <button
        className="hamburger-btn"
        onClick={onToggle}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </header>
  )
}
