'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

interface Course { id: string; name: string; code: string }
interface Assessment {
  id: string; title: string; category: string; max_marks: number;
  due_date: string | null; description: string | null; is_published: boolean; created_at: string
}

const CATEGORIES = [
  { value: 'assignment', label: 'Assignment', icon: '📝', color: '#4f8ef7' },
  { value: 'quiz', label: 'Quiz', icon: '❓', color: '#9b5ef7' },
  { value: 'mid_exam', label: 'Mid Exam', icon: '📋', color: '#f5c842' },
  { value: 'final_exam', label: 'Final Exam', icon: '🎓', color: '#f74f4f' },
  { value: 'activity', label: 'Activity', icon: '🔬', color: '#3dd68c' },
  { value: 'project', label: 'Project', icon: '💡', color: '#f7944f' },
  { value: 'viva', label: 'Viva', icon: '🎤', color: '#f74fa1' },
]

export default function AssessmentsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('Teacher')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'assignment', maxMarks: '20', dueDate: '', description: '', isPublished: true })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(d => {
      if (d.courses) { setCourses(d.courses); if (d.courses[0]) setSelectedCourse(d.courses[0].id) }
    })
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.fullName) setUserName(d.fullName) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setLoading(true)
    fetch(`/api/assessments?courseId=${selectedCourse}`)
      .then(r => r.json())
      .then(d => { setAssessments(d.assessments || []); setLoading(false) })
  }, [selectedCourse])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: selectedCourse, ...form, maxMarks: parseFloat(form.maxMarks) }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setForm({ title: '', category: 'assignment', maxMarks: '20', dueDate: '', description: '', isPublished: true })
      fetch(`/api/assessments?courseId=${selectedCourse}`).then(r => r.json()).then(d => setAssessments(d.assessments || []))
      setTimeout(() => { setSaved(false); setShowForm(false) }, 1500)
    }
  }

  async function togglePublish(a: Assessment) {
    await fetch('/api/assessments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, isPublished: !a.is_published }),
    })
    setAssessments(prev => prev.map(x => x.id === a.id ? { ...x, is_published: !x.is_published } : x))
  }

  const groupedByCategory = CATEGORIES.map(cat => ({
    ...cat,
    items: assessments.filter(a => a.category === cat.value),
  })).filter(g => g.items.length > 0)

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="teacher" userName={userName} />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800' }}>📝 Assessments</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Create and manage assignments, quizzes, exams</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '➕ New Assessment'}
          </button>
        </div>

        {/* Course selector */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select className="input-dark" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ maxWidth: '280px' }}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
          </select>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{assessments.length} total assessments</span>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px' }}>Create Assessment</h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Title</label>
                  <input className="input-dark" placeholder="e.g. Assignment 1 – Arrays" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Category</label>
                  <select className="input-dark" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Max Marks</label>
                  <input className="input-dark" type="number" min="1" value={form.maxMarks} onChange={e => setForm(f => ({ ...f, maxMarks: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Due Date</label>
                  <input className="input-dark" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px' }}>
                  <input
                    type="checkbox"
                    id="published"
                    checked={form.isPublished}
                    onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="published" style={{ fontSize: '13px', cursor: 'pointer' }}>Publish immediately</label>
                </div>
              </div>
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Creating...' : saved ? '✅ Created!' : 'Create Assessment'}
              </button>
            </form>
          </div>
        )}

        {/* Assessments grouped by category */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : assessments.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <p style={{ color: 'var(--text-muted)' }}>No assessments yet. Create the first one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {groupedByCategory.map(group => (
              <div key={group.value}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{group.icon}</span>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: group.color }}>{group.label}</h3>
                  <span style={{ padding: '2px 8px', background: `rgba(${hexToRgb(group.color)},0.12)`, borderRadius: '99px', fontSize: '11px', color: group.color }}>
                    {group.items.length}
                  </span>
                </div>
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                  <table className="table-dark">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Max Marks</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map(a => (
                        <tr key={a.id}>
                          <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{a.title}</td>
                          <td>{a.max_marks}</td>
                          <td style={{ fontSize: '12px' }}>{a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}</td>
                          <td>
                            <span style={{
                              padding: '3px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '600',
                              background: a.is_published ? 'rgba(61,214,140,0.12)' : 'rgba(120,120,140,0.12)',
                              color: a.is_published ? 'var(--accent-green)' : 'var(--text-muted)',
                            }}>
                              {a.is_published ? '● Published' : '○ Draft'}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => togglePublish(a)}
                              style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                                background: a.is_published ? 'rgba(247,79,79,0.1)' : 'rgba(61,214,140,0.1)',
                                color: a.is_published ? 'var(--accent-red)' : 'var(--accent-green)',
                                border: `1px solid ${a.is_published ? 'rgba(247,79,79,0.2)' : 'rgba(61,214,140,0.2)'}`,
                              }}
                            >
                              {a.is_published ? 'Unpublish' : 'Publish'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
