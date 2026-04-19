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
}

interface Course { id: string; name: string; code: string }

export default function StudentLeaderboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myId, setMyId] = useState('')
  const [loading, setLoading] = useState(false)
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
    if (!selectedCourse) return
    setLoading(true)
    fetch(`/api/leaderboard?courseId=${selectedCourse}`)
      .then(r => r.json())
      .then(d => { setLeaderboard(d.leaderboard || []); setLoading(false) })
  }, [selectedCourse])

  const myEntry = leaderboard.find(s => s.studentId === myId)
  const myRankBadge = myEntry ? getRankBadge(myEntry.rank) : null

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="student" userName={userName} />
      <main className="main-content">
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800' }}>🏆 Leaderboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            See how you rank among your classmates
          </p>
        </div>

        {/* Course selector */}
        {courses.length > 1 && (
          <div style={{ marginBottom: '20px', maxWidth: '280px' }}>
            <select className="input-dark" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
          </div>
        )}

        {/* My rank spotlight */}
        {myEntry && (
          <div style={{
            padding: '20px 24px', borderRadius: '16px', marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(79,142,247,0.12), rgba(155,94,247,0.08))',
            border: '1px solid rgba(79,142,247,0.25)',
            display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: '48px' }} className="medal-float">
              {myRankBadge?.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                Your Position
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: '800' }}>
                Rank #{myEntry.rank} out of {leaderboard.length}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
                Score: {myEntry.score.toFixed(1)}% · Grade: {getLetterGrade(myEntry.score).grade}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {myEntry.rank > 1 && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {(leaderboard[myEntry.rank - 2]?.score - myEntry.score).toFixed(1)}% behind #{myEntry.rank - 1}
                </div>
              )}
              {myEntry.rank < leaderboard.length && (
                <div style={{ fontSize: '13px', color: 'var(--accent-green)' }}>
                  {(myEntry.score - leaderboard[myEntry.rank]?.score).toFixed(1)}% ahead of #{myEntry.rank + 1}
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading rankings...</div>
        ) : leaderboard.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <p style={{ color: 'var(--text-muted)' }}>No rankings yet. Wait for your teacher to enter marks.</p>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {leaderboard.length >= 2 && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '28px', alignItems: 'flex-end' }}>
                {[leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean).map((s, idx) => {
                  const positions = [2, 1, 3]
                  const pos = positions[idx]
                  const isMe = s.studentId === myId
                  const { grade } = getLetterGrade(s.score)
                  const heights = ['150px', '190px', '130px']
                  const badge = getRankBadge(pos)
                  return (
                    <div key={s.studentId} style={{ textAlign: 'center', flex: pos === 1 ? '0 0 210px' : '0 0 170px' }}>
                      <div style={{ fontSize: pos === 1 ? '44px' : '32px', marginBottom: '8px' }} className="medal-float">
                        {badge.emoji}
                      </div>
                      {isMe && (
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          ← YOU
                        </div>
                      )}
                      <div style={{
                        background: isMe
                          ? 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(155,94,247,0.12))'
                          : pos === 1 ? 'linear-gradient(135deg,rgba(245,200,66,0.12),rgba(247,148,79,0.08))' : 'var(--bg-card)',
                        border: `1px solid ${isMe ? 'rgba(79,142,247,0.4)' : pos === 1 ? 'rgba(245,200,66,0.25)' : 'var(--border)'}`,
                        borderRadius: '14px 14px 0 0', padding: '14px',
                        height: heights[idx],
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>{s.fullName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{s.rollNumber}</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: pos === 1 ? '26px' : '20px', fontWeight: '800' }}
                          className={pos <= 3 ? `rank-${pos}` : ''}>
                          {s.score.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{grade}</div>
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
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map(s => {
                    const { grade, color } = getLetterGrade(s.score)
                    const isMe = s.studentId === myId
                    return (
                      <tr key={s.studentId} style={{
                        background: isMe ? 'rgba(79,142,247,0.06)' : undefined,
                      }}>
                        <td>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '15px' }}
                            className={s.rank <= 3 ? `rank-${s.rank}` : ''}>
                            {s.rank <= 3 ? getRankBadge(s.rank).emoji : `#${s.rank}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                                {s.fullName}
                                {isMe && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--accent-blue)', fontWeight: '700' }}>YOU</span>}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.rollNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>
                            {s.score.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <span style={{ color, fontWeight: '700', fontSize: '14px' }}>{grade}</span>
                        </td>
                        <td>
                          <div style={{ width: '120px', height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${s.score}%`, height: '100%', background: isMe ? 'var(--gradient-blue)' : 'linear-gradient(90deg, rgba(79,142,247,0.5), rgba(155,94,247,0.5))', borderRadius: '99px' }} />
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
