'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutGrid, UtensilsCrossed, CreditCard, Users,
  Package, BarChart2, LogOut, ClipboardList,
  ChevronRight, ChefHat
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const navItems: NavItem[] = [
  { label: 'Tables', href: '/dashboard/tables', icon: <LayoutGrid size={18} />, roles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
  { label: 'Orders', href: '/dashboard/orders', icon: <ClipboardList size={18} />, roles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
  { label: 'Payments', href: '/dashboard/payment', icon: <CreditCard size={18} />, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { label: 'Menu', href: '/dashboard/menu', icon: <UtensilsCrossed size={18} />, roles: ['ADMIN'] },
  { label: 'Inventory', href: '/dashboard/inventory', icon: <Package size={18} />, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Recipes', href: '/dashboard/recipes', icon: <ChefHat size={18} />, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Staff', href: '/dashboard/staff', icon: <Users size={18} />, roles: ['ADMIN'] },
  { label: 'Reports', href: '/dashboard/reports', icon: <BarChart2 size={18} />, roles: ['ADMIN', 'MANAGER'] },
]

interface SidebarProps {
  user: { id: string; username: string; fullName: string; role: string }
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ user, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const filtered = navItems.filter(item => item.roles.includes(user.role))

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function handleNavClick() {
    onClose?.()
  }

  return (
    <>
      {/* Backdrop overlay — only rendered on mobile when open */}
      {onClose && (
        <div
          className={`sidebar-overlay${isOpen ? ' active' : ''}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--black-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: '1.5px solid var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(201,168,76,0.05)', flexShrink: 0
            }}>
              <span style={{ fontSize: '14px' }}>✦</span>
            </div>
            <div>
              <div className="font-cinzel gold-text" style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px' }}>
                DIVA ADDIS
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '2px' }}>LOUNGE</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--black-border)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{user.fullName}</div>
          <div style={{
            fontSize: '11px', marginTop: '4px', display: 'inline-flex',
            alignItems: 'center', gap: '4px', color: 'var(--gold)',
            background: 'rgba(201,168,76,0.08)', padding: '2px 8px',
            borderRadius: '10px', border: '1px solid rgba(201,168,76,0.2)'
          }}>
            {user.role}
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {filtered.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 12px', borderRadius: '8px', marginBottom: '2px',
                  color: active ? 'var(--gold)' : 'var(--text-secondary)',
                  background: active ? 'rgba(201,168,76,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(201,168,76,0.15)' : '1px solid transparent',
                  textDecoration: 'none', fontSize: '14px', fontWeight: active ? '600' : '400',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <ChevronRight size={14} />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--black-border)' }}>
          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '11px 12px' }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
