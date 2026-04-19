'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

interface Course { id: string; name: string; code: string }
interface Student { id: string; full_name: string; email: string; roll_number: string; is_active: boolean; created_at: string }

export default function StudentsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('Teacher')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', rollNumber: '', password: 'demo123' })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(d => {
      if (d.courses) { setCourses(d.courses); if (d.courses[0]) setSelectedCourse(d.courses[0].id) }
    })
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.fullName) setUserName(d.fullName) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setLoading(true)
    fetch(`/api/students?courseId=${selectedCourse}`)
      .then(r => r.json())
      .then(d => { setStudents(d.students || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedCourse])

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    setFormSuccess('')

    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, courseId: selectedCourse }),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setFormError(data.error || 'Failed to add student')
    } else {
      setFormSuccess(`${form.fullName} added successfully!`)
      setForm({ fullName: '', email: '', rollNumber: '', password: 'demo123' })
      // Refresh list
      fetch(`/api/students?courseId=${selectedCourse}`).then(r => r.json()).then(d => setStudents(d.students || []))
      setTimeout(() => { setFormSuccess(''); setShowForm(false) }, 2000)
    }
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="teacher" userName={userName} />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800' }}>👥 Students</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Manage student enrollment and accounts</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '➕ Add Student'}
          </button>
        </div>

        {/* Add Student Form */}
        {showForm && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px' }}>Enroll New Student</h2>
            <form onSubmit={handleAddStudent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                {[
                  { key: 'fullName', label: 'Full Name', placeholder: 'Ali Hassan', type: 'text' },
                  { key: 'email', label: 'Email', placeholder: 'ali@student.edu', type: 'email' },
                  { key: 'rollNumber', label: 'Roll Number', placeholder: 'CS-2024-001', type: 'text' },
                  { key: 'password', label: 'Password', placeholder: 'Initial password', type: 'text' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {field.label}
                    </label>
                    <input
                      className="input-dark"
                      type={field.type}
                      placeholder={field.placeholder}
                      value={(form as any)[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      required
                    />
                  </div>
                ))}
              </div>

              {formError && (
                <div style={{ padding: '10px', background: 'rgba(247,79,79,0.1)', border: '1px solid rgba(247,79,79,0.3)', borderRadius: '8px', color: '#f74f4f', fontSize: '13px', marginBottom: '12px' }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '10px', background: 'rgba(61,214,140,0.1)', border: '1px solid rgba(61,214,140,0.3)', borderRadius: '8px', color: 'var(--accent-green)', fontSize: '13px', marginBottom: '12px' }}>
                  ✅ {formSuccess}
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Student'}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <select className="input-dark" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ width: 'auto', minWidth: '200px' }}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
          </select>
          <input
            className="input-dark"
            placeholder="Search by name, roll no, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />
        </div>

        {/* Students table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {filtered.length} student{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {students.length === 0 ? 'No students enrolled yet.' : 'No students match your search.'}
            </div>
          ) : (
            <table className="table-dark">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Roll Number</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-blue)', fontSize: '13px' }}>{s.roll_number || '—'}</td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{s.full_name}</td>
                    <td style={{ fontSize: '13px' }}>{s.email}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '600',
                        background: s.is_active ? 'rgba(61,214,140,0.12)' : 'rgba(247,79,79,0.12)',
                        color: s.is_active ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}>
                        {s.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
