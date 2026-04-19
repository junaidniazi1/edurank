'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        if (data.role === 'teacher' || data.role === 'admin') {
          router.push('/dashboard/teacher')
        } else {
          router.push('/dashboard/student')
        }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '20%', left: '10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '20%', right: '10%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(155,94,247,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--gradient-blue)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px',
          }}>🏆</div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '28px',
            fontWeight: '800',
            background: 'var(--gradient-blue)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>EduRank</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Student Leaderboard & Grading System
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                className="input-dark"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password
              </label>
              <input
                className="input-dark"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(247,79,79,0.1)',
                border: '1px solid rgba(247,79,79,0.3)',
                borderRadius: '10px',
                color: '#f74f4f',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Demo Credentials
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 10px', borderRadius: '99px',
                background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)',
                fontSize: '12px', color: 'var(--accent-blue)',
              }}>
                Teacher: teacher@demo.com
              </span>
              <span style={{
                padding: '4px 10px', borderRadius: '99px',
                background: 'rgba(61,214,140,0.1)', border: '1px solid rgba(61,214,140,0.2)',
                fontSize: '12px', color: 'var(--accent-green)',
              }}>
                Student: student@demo.com
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Password: <strong style={{ color: 'var(--text-secondary)' }}>demo123</strong>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Don&apos;t have an account? Contact your teacher for enrollment.
        </p>
      </div>
    </div>
  )
}
