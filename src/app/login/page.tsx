'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Invalid username or password')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.03) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeIn 0.4s ease' }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '2px solid var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            background: 'rgba(201,168,76,0.05)'
          }}>
            <span style={{ fontSize: '32px' }}>✦</span>
          </div>
          <h1 className="font-cinzel" style={{
            fontSize: '22px',
            fontWeight: '700',
            letterSpacing: '2px',
            marginBottom: '4px'
          }}>
            <span className="gold-text">DIVA ADDIS</span>
          </h1>
          <p className="font-cinzel" style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            letterSpacing: '4px',
            textTransform: 'uppercase'
          }}>
            LOUNGE — POS SYSTEM
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ border: '1px solid var(--black-border)' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Staff Login
          </h2>

          {error && (
            <div style={{
              background: 'rgba(230,57,70,0.1)',
              border: '1px solid var(--danger-light)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--danger-light)',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              style={{ width: '100%', fontSize: '15px', padding: '14px' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="animate-pulse">●</span> Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '20px' }}>
          Diva Addis Lounge · Addis Ababa, Ethiopia
        </p>
      </div>
    </main>
  )
}
