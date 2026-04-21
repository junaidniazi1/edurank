'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to change password')
    } else {
      setSuccess(true)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }
  }

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="student" userName="Student" />
      <main className="main-content">
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800' }}>
            🔒 Change Password
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Update your account password
          </p>
        </div>

        <div className="glass-card" style={{ padding: '28px', maxWidth: '440px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Password Changed!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Your password has been updated successfully.
              </p>
              <button
                className="btn-primary"
                onClick={() => setSuccess(false)}
              >
                Change Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {[
                { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                { key: 'newPassword', label: 'New Password', placeholder: 'At least 6 characters' },
                { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Repeat new password' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block', fontSize: '12px', fontWeight: '600',
                    color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase',
                  }}>
                    {field.label}
                  </label>
                  <input
                    className="input-dark"
                    type="password"
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    required
                  />
                </div>
              ))}

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
                {loading ? 'Updating...' : '🔒 Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}