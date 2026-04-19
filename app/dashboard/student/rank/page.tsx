'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getLetterGrade, getRankBadge } from '@/lib/auth'

interface LeaderboardEntry {
  studentId: string; fullName: string; rollNumber: string
  score: number; rank: number; breakdown: Record<string, number>
}

interface Course { id: string; name: string; code: string }

const BREAKDOWN_LABELS: Record<string, { label: string; icon: string }> = {
  assignments: { label: 'Assignments', icon: '📝' },
  quizzes: { label: 'Quizzes', icon: '❓' },
  mid_exam: { label: 'Mid Exam', icon: '📋' },
  final_exam: { label: 'Final Exam', icon: '🎓' },
  activities: { label: 'Activities', icon: '🔬' },
  project: { label: 'Project', icon: '💡' },
  viva: { label: 'Viva', icon: '🎤' },
}

export default function RankPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null)
  const [totalStudents, setTotalStudents] = useState(0)
  const [loading, setLoading] = useState(false)
  const [myId, setMyId] = useState('')
  const [userName, setUserName] = useState('Student')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.fullName) setUserName(d.fullName)
      if (d.userId) setMyId(d.userId)
    }).catch(() => {})
    fetch('/api/courses').then(r => r.json()).then(d => {
      if (d.courses?.length) { setCourses(d.courses); setSelectedCourse(d.courses[0].id) }
    })
  }, [])

  useEffect(() => {
    if (!selectedCourse || !myId) return
    setLoading(true)
    fetch(`/api/leaderboard?courseId=${selectedCourse}`)
      .then(r => r.json())
      .then(d => {
        const lb = d.leaderboard || []
        setTotalStudents(lb.length)
        setMyEntry(lb.find((s: LeaderboardEntry) => s.studentId === myId) || null)
        setLoading(false)
      })
  }, [selectedCourse, myId])

  const gradeInfo = myEntry ? getLetterGrade(myEntry.score) : null
  const rankBadge = myEntry ? getRankBadge(myEntry.rank) : null
  const percentile = myEntry && totalStudents > 0
    ? Math.round(((totalStudents - myEntry.rank) / totalStudents) * 100)
    : 0

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="student" userName={userName} />
      <main className="main-content">
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800' }}>⭐ My Rank Card</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Your complete academic standing</p>
        </div>

        {courses.length > 1 && (
          <div style={{ marginBottom: '24px', maxWidth: '280px' }}>
            <select className="input-dark" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading your rank...</div>
        ) : !myEntry ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ color: 'var(--text-muted)' }}>No data yet. Wait for your teacher to publish marks.</p>
          </div>
        ) : (
          <>
            {/* Rank card hero */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(79,142,247,0.12), rgba(155,94,247,0.08))',
              border: '1px solid rgba(79,142,247,0.25)',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '24px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Background decoration */}
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px',
                width: '200px', height: '200px',
                background: 'radial-gradient(circle, rgba(245,200,66,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
              }} />

              <div style={{ fontSize: '64px', marginBottom: '12px' }} className="medal-float">
                {rankBadge?.emoji}
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '64px', fontWeight: '800', lineHeight: 1, marginBottom: '8px' }}
                className={myEntry.rank <= 3 ? `rank-${myEntry.rank}` : ''}>
                #{myEntry.rank}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {userName}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {myEntry.rollNumber} · out of {totalStudents} students
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: '800',
                    background: 'var(--gradient-blue)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {myEntry.score.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Score</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: '800', color: gradeInfo?.color }}>
                    {gradeInfo?.grade}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Grade</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: '800', color: 'var(--accent-green)' }}>
                    {gradeInfo?.gpa.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>GPA</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: '800', color: 'var(--accent-purple)' }}>
                    {percentile}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Percentile</div>
                </div>
              </div>
            </div>

            {/* Breakdown by category */}
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Score Breakdown by Category
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
              {Object.entries(myEntry.breakdown).filter(([, v]) => v > 0).map(([key, value]) => {
                const info = BREAKDOWN_LABELS[key] || { label: key, icon: '📄' }
                const { grade: g, color: c } = getLetterGrade(value)
                return (
                  <div key={key} className="glass-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </div>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: c }}>{g}</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: 'var(--gradient-blue)', borderRadius: '99px' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{value.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
