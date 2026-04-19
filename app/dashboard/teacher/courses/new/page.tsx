'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function NewCoursePage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', code: '', description: '', semester: 'Fall', year: new Date().getFullYear().toString() })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, year: parseInt(form.year) }),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) setError(data.error || 'Failed to create course')
    else router.push('/dashboard/teacher')
  }

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="teacher" userName="Teacher" />
      <main className="main-content">
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800' }}>📚 New Course</h1>
        </div>
        <div className="glass-card" style={{ padding: '28px', maxWidth: '520px' }}>
          <form onSubmit={handleCreate}>
            {[
              { key: 'name', label: 'Course Name', placeholder: 'Data Structures & Algorithms', type: 'text' },
              { key: 'code', label: 'Course Code', placeholder: 'CS-301', type: 'text' },
              { key: 'description', label: 'Description', placeholder: 'Brief description...', type: 'text' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>{field.label}</label>
                <input className="input-dark" type={field.type} placeholder={field.placeholder} value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} required={field.key !== 'description'} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Semester</label>
                <select className="input-dark" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                  {['Spring', 'Summer', 'Fall', 'Winter'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Year</label>
                <input className="input-dark" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              </div>
            </div>
            {error && <div style={{ padding: '10px', background: 'rgba(247,79,79,0.1)', border: '1px solid rgba(247,79,79,0.3)', borderRadius: '8px', color: '#f74f4f', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Course'}</button>
              <button className="btn-secondary" type="button" onClick={() => router.back()}>Cancel</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
