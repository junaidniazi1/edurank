'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

interface Course { id: string; name: string; code: string }

const COMPONENTS = [
  { key: 'assignments', label: 'Assignments', icon: '📝', desc: 'Homework & written assignments' },
  { key: 'quizzes', label: 'Quizzes', icon: '❓', desc: 'Short in-class quizzes' },
  { key: 'mid_exam', label: 'Mid Term Exam', icon: '📋', desc: 'Mid-semester examination' },
  { key: 'final_exam', label: 'Final Exam', icon: '🎓', desc: 'Final semester examination' },
  { key: 'activities', label: 'Activities', icon: '🔬', desc: 'Lab activities & classwork' },
  { key: 'project', label: 'Project', icon: '💡', desc: 'Course project' },
  { key: 'viva', label: 'Viva / Oral', icon: '🎤', desc: 'Oral examination / viva voce' },
]

export default function WeightagePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [weights, setWeights] = useState<Record<string, number>>({
    assignments: 10, quizzes: 10, mid_exam: 25, final_exam: 40, activities: 5, project: 5, viva: 5
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('Teacher')

  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  const isValid = Math.abs(total - 100) < 0.01

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(d => {
      if (d.courses) { setCourses(d.courses); if (d.courses[0]) setSelectedCourse(d.courses[0].id) }
    })
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.fullName) setUserName(d.fullName) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    fetch(`/api/weightage?courseId=${selectedCourse}`)
      .then(r => r.json())
      .then(d => { if (d.config) setWeights(d.config) })
  }, [selectedCourse])

  async function handleSave() {
    if (!isValid) { setError(`Total must be 100% (currently ${total.toFixed(1)}%)`); return }
    setSaving(true)
    setError('')

    const res = await fetch('/api/weightage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: selectedCourse, ...weights }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    else { const d = await res.json(); setError(d.error || 'Failed to save') }
  }

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="teacher" userName={userName} />
      <main className="main-content">
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800' }}>⚖️ Weightage Config</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Set how each assessment category contributes to the final grade
          </p>
        </div>

        {/* Course selector */}
        <div style={{ marginBottom: '24px', maxWidth: '300px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
            Course
          </label>
          <select className="input-dark" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
          </select>
        </div>

        {/* Total indicator */}
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Weightage</span>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: '800', marginTop: '2px',
              color: isValid ? 'var(--accent-green)' : total > 100 ? 'var(--accent-red)' : 'var(--accent-gold)' }}>
              {total.toFixed(1)}%
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {isValid ? (
              <span style={{ padding: '6px 14px', background: 'rgba(61,214,140,0.12)', border: '1px solid rgba(61,214,140,0.25)', borderRadius: '99px', color: 'var(--accent-green)', fontSize: '13px', fontWeight: '600' }}>
                ✅ Valid
              </span>
            ) : (
              <span style={{ padding: '6px 14px', background: 'rgba(247,200,66,0.12)', border: '1px solid rgba(247,200,66,0.25)', borderRadius: '99px', color: 'var(--accent-gold)', fontSize: '13px', fontWeight: '600' }}>
                ⚠️ Must equal 100%
              </span>
            )}
          </div>
        </div>

        {/* Weightage sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {COMPONENTS.map(comp => (
            <div key={comp.key} className="glass-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{comp.icon}</span> {comp.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{comp.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={weights[comp.key] ?? 0}
                    onChange={e => setWeights(w => ({ ...w, [comp.key]: parseFloat(e.target.value) || 0 }))}
                    className="input-dark"
                    style={{ width: '70px', textAlign: 'center', fontWeight: '700', fontSize: '16px' }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>%</span>
                </div>
              </div>
              <div style={{ height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(weights[comp.key] || 0, 100)}%`,
                  height: '100%',
                  background: 'var(--gradient-blue)',
                  borderRadius: '99px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(247,79,79,0.1)', border: '1px solid rgba(247,79,79,0.3)', borderRadius: '10px', color: '#f74f4f', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button className="btn-primary" onClick={handleSave} disabled={saving || !isValid} style={{ fontSize: '14px', padding: '12px 28px' }}>
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Weightage Config'}
        </button>
      </main>
    </div>
  )
}
