'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getLetterGrade } from '@/lib/auth'

interface Course { id: string; name: string; code: string }
interface Mark {
  id: string; obtained_marks: number | null; feedback: string | null; graded_at: string | null
  assessment: { id: string; title: string; category: string; max_marks: number; due_date: string | null } | null
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  assignment: { label: 'Assignment', icon: '📝', color: '#4f8ef7' },
  quiz: { label: 'Quiz', icon: '❓', color: '#9b5ef7' },
  mid_exam: { label: 'Mid Exam', icon: '📋', color: '#f5c842' },
  final_exam: { label: 'Final Exam', icon: '🎓', color: '#f74f4f' },
  activity: { label: 'Activity', icon: '🔬', color: '#3dd68c' },
  project: { label: 'Project', icon: '💡', color: '#f7944f' },
  viva: { label: 'Viva', icon: '🎤', color: '#f74fa1' },
}

export default function StudentMarksPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [marks, setMarks] = useState<Mark[]>([])
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('Student')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.fullName) setUserName(d.fullName) }).catch(() => {})
    fetch('/api/courses').then(r => r.json()).then(d => {
      if (d.courses?.length) { setCourses(d.courses); setSelectedCourse(d.courses[0].id) }
    })
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setLoading(true)
    fetch(`/api/marks?courseId=${selectedCourse}`)
      .then(r => r.json())
      .then(d => { setMarks(d.marks || []); setLoading(false) })
  }, [selectedCourse])

  const categories: string[] = ['all', ...new Set(marks.map(m => m.assessment?.category).filter((c): c is string => !!c))]
  const filtered = activeCategory === 'all' ? marks : marks.filter(m => m.assessment?.category === activeCategory)

  // Summary stats
  const gradedMarks = marks.filter(m => m.obtained_marks != null && m.assessment)
  const overallPct = gradedMarks.length > 0
    ? gradedMarks.reduce((sum, m) => sum + ((m.obtained_marks! / m.assessment!.max_marks) * 100), 0) / gradedMarks.length
    : 0

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="student" userName={userName} />
      <main className="main-content">
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800' }}>📊 My Marks</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Detailed breakdown of all your assessments</p>
        </div>

        {/* Course selector */}
        {courses.length > 1 && (
          <div style={{ marginBottom: '20px', maxWidth: '280px' }}>
            <select className="input-dark" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
          </div>
        )}

        {/* Summary card */}
        {gradedMarks.length > 0 && (
          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Overall Average</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: '800',
                background: 'var(--gradient-blue)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {overallPct.toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Letter Grade</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: '800', color: getLetterGrade(overallPct).color }}>
                {getLetterGrade(overallPct).grade}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>GPA Points</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: '800', color: 'var(--accent-purple)' }}>
                {getLetterGrade(overallPct).gpa.toFixed(1)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {gradedMarks.length} of {marks.length} assessments graded
              </div>
              <div style={{ height: '8px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${marks.length > 0 ? (gradedMarks.length / marks.length) * 100 : 0}%`, height: '100%', background: 'var(--gradient-blue)', borderRadius: '99px' }} />
              </div>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {categories.map(cat => {
            const info = cat === 'all' ? { label: 'All', icon: '📋', color: 'var(--accent-blue)' } : CATEGORY_LABELS[cat]
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as string)}
                style={{
                  padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', border: '1px solid',
                  background: isActive ? `${info?.color}22` : 'transparent',
                  borderColor: isActive ? info?.color || 'var(--accent-blue)' : 'var(--border)',
                  color: isActive ? info?.color || 'var(--accent-blue)' : 'var(--text-muted)',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
              >
                {info?.icon} {info?.label || cat}
              </button>
            )
          })}
        </div>

        {/* Marks */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No marks available yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {filtered.map(m => {
              const cat = m.assessment?.category || ''
              const info = CATEGORY_LABELS[cat] || { label: cat, icon: '📄', color: 'var(--accent-blue)' }
              const pct = m.assessment && m.obtained_marks != null
                ? (m.obtained_marks / m.assessment.max_marks) * 100 : null
              const gradeInfo = pct != null ? getLetterGrade(pct) : null

              return (
                <div key={m.id} className="glass-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
                      background: `${info.color}18`, color: info.color, border: `1px solid ${info.color}30`,
                      textTransform: 'uppercase',
                    }}>
                      {info.icon} {info.label}
                    </span>
                    {gradeInfo && (
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: '800', color: gradeInfo.color }}>
                        {gradeInfo.grade}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                    {m.assessment?.title || 'Assessment'}
                  </h3>

                  {m.obtained_marks != null ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {m.obtained_marks}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>/ {m.assessment?.max_marks}</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${info.color}, ${info.color}88)`, borderRadius: '99px' }} />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {pct?.toFixed(1)}% · {m.graded_at ? `Graded ${new Date(m.graded_at).toLocaleDateString()}` : ''}
                      </div>
                      {m.feedback && (
                        <div style={{ marginTop: '10px', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          💬 {m.feedback}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
                      ⏳ Not graded yet
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
