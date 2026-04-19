'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getLetterGrade, getRankBadge } from '@/lib/auth'

interface LeaderboardEntry {
  studentId: string
  fullName: string
  rollNumber: string
  score: number
  rank: number
  breakdown: Record<string, number>
  marksCount: number
  totalAssessments: number
}

interface Course { id: string; name: string; code: string }

export default function TeacherLeaderboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('Teacher')

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(d => {
      if (d.courses?.length) {
        setCourses(d.courses)
        setSelectedCourse(d.courses[0].id)
      }
    })
    // get user info from cookie via me endpoint
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.fullName) setUserName(d.fullName)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setLoading(true)
    fetch(`/api/leaderboard?courseId=${selectedCourse}`)
      .then(r => r.json())
      .then(d => { setLeaderboard(d.leaderboard || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedCourse])

  function exportCSV() {
    if (!leaderboard.length) return
    const headers = ['Rank', 'Roll No', 'Name', 'Total Score', 'Grade', 'Assignments', 'Quizzes', 'Mid', 'Final', 'Activities', 'Project', 'Viva']
    const rows = leaderboard.map(s => {
      const g = getLetterGrade(s.score)
      return [
        s.rank, s.rollNumber, s.fullName, s.score.toFixed(1), g.grade,
        (s.breakdown.assignments || 0).toFixed(1),
        (s.breakdown.quizzes || 0).toFixed(1),
        (s.breakdown.mid_exam || 0).toFixed(1),
        (s.breakdown.final_exam || 0).toFixed(1),
        (s.breakdown.activities || 0).toFixed(1),
        (s.breakdown.project || 0).toFixed(1),
        (s.breakdown.viva || 0).toFixed(1),
      ]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leaderboard-${selectedCourse}.csv`
    a.click()
  }

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="teacher" userName={userName} />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800' }}>🏆 Leaderboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Real-time student rankings by weighted score</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="input-dark"
              style={{ width: 'auto', paddingRight: '32px' }}
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
            <button className="btn-secondary" onClick={exportCSV}>📥 Export CSV</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading rankings...</div>
        ) : leaderboard.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <p style={{ color: 'var(--text-muted)' }}>No data yet. Add students and enter marks to see rankings.</p>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {top3.length >= 2 && (
              <div style={{
                display: 'flex', gap: '16px', justifyContent: 'center',
                marginBottom: '32px', alignItems: 'flex-end',
              }}>
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((s, idx) => {
                  const positions = [2, 1, 3]
                  const pos = positions[idx]
                  const heights = ['160px', '200px', '140px']
                  const badges = getRankBadge(pos)
                  const { grade } = getLetterGrade(s.score)
                  return (
                    <div key={s.studentId} style={{
                      textAlign: 'center',
                      flex: pos === 1 ? '0 0 220px' : '0 0 180px',
                    }}>
                      <div style={{ fontSize: pos === 1 ? '48px' : '36px', marginBottom: '8px' }} className="medal-float">
                        {badges.emoji}
                      </div>
                      <div style={{
                        background: pos === 1 ? 'linear-gradient(135deg, rgba(245,200,66,0.15), rgba(247,148,79,0.1))' : 'var(--bg-card)',
                        border: `1px solid ${pos === 1 ? 'rgba(245,200,66,0.3)' : 'var(--border)'}`,
                        borderRadius: '16px 16px 0 0',
                        padding: '16px',
                        height: heights[idx],
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      }}>
                        <div style={{ fontWeight: '700', fontSize: pos === 1 ? '15px' : '13px', marginBottom: '4px' }}>{s.fullName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{s.rollNumber}</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: pos === 1 ? '28px' : '22px', fontWeight: '800' }}
                          className={pos === 1 ? 'rank-1' : pos === 2 ? 'rank-2' : 'rank-3'}>
                          {s.score.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{grade}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Full table */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Assign</th>
                    <th>Quiz</th>
                    <th>Mid</th>
                    <th>Final</th>
                    <th>Project</th>
                    <th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map(s => {
                    const { grade, color } = getLetterGrade(s.score)
                    const badge = getRankBadge(s.rank)
                    const completion = s.totalAssessments > 0
                      ? Math.round((s.marksCount / s.totalAssessments) * 100)
                      : 0
                    return (
                      <tr key={s.studentId}>
                        <td>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '15px' }}
                            className={s.rank <= 3 ? `rank-${s.rank}` : ''}>
                            {s.rank <= 3 ? badge.emoji : `#${s.rank}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{s.fullName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.rollNumber}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>
                            {s.score.toFixed(1)}
                          </span>
                        </td>
                        <td>
                          <span style={{ color, fontWeight: '700', fontSize: '14px' }}>{grade}</span>
                        </td>
                        <td>{(s.breakdown.assignments || 0).toFixed(0)}%</td>
                        <td>{(s.breakdown.quizzes || 0).toFixed(0)}%</td>
                        <td>{(s.breakdown.mid_exam || 0).toFixed(0)}%</td>
                        <td>{(s.breakdown.final_exam || 0).toFixed(0)}%</td>
                        <td>{(s.breakdown.project || 0).toFixed(0)}%</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ width: `${completion}%`, height: '100%', background: 'var(--gradient-blue)', borderRadius: '99px' }} />
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '32px' }}>{completion}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
