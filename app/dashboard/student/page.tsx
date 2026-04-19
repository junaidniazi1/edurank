import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { getLetterGrade, getRankBadge } from '@/lib/auth'
import Link from 'next/link'

export default async function StudentDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'teacher' || user.role === 'admin') redirect('/dashboard/teacher')

  // Get enrolled courses
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('course_id, courses(*)')
    .eq('student_id', user.userId)

  const courses = enrollments?.map((e: any) => e.courses) || []

  // Get marks for first course
  let recentMarks: any[] = []
  let myRank = null
  let totalScore = 0

  if (courses[0]) {
    const courseId = courses[0].id
    const { data: marks } = await supabaseAdmin
      .from('marks')
      .select('*, assessment:assessments(title, category, max_marks)')
      .eq('student_id', user.userId)
      .eq('course_id', courseId)
      .order('graded_at', { ascending: false })
      .limit(5)

    recentMarks = marks || []

    // Calculate rank by fetching leaderboard
    const { data: allEnrollments } = await supabaseAdmin
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId)

    const { data: allMarks } = await supabaseAdmin
      .from('marks')
      .select('student_id, obtained_marks, assessment_id')
      .eq('course_id', courseId)

    const { data: assessments } = await supabaseAdmin
      .from('assessments')
      .select('id, max_marks')
      .eq('course_id', courseId)
      .eq('is_published', true)

    // Simple avg score per student
    const studentScores: Record<string, number[]> = {}
    allEnrollments?.forEach(e => { studentScores[e.student_id] = [] })
    allMarks?.forEach(m => {
      const a = assessments?.find(x => x.id === m.assessment_id)
      if (a && m.obtained_marks != null) {
        if (!studentScores[m.student_id]) studentScores[m.student_id] = []
        studentScores[m.student_id].push((m.obtained_marks / a.max_marks) * 100)
      }
    })

    const avgScores = Object.entries(studentScores).map(([sid, scores]) => ({
      sid,
      avg: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    })).sort((a, b) => b.avg - a.avg)

    const myEntry = avgScores.find(s => s.sid === user.userId)
    myRank = myEntry ? avgScores.findIndex(s => s.sid === user.userId) + 1 : null
    totalScore = myEntry?.avg || 0
  }

  const { grade, color } = getLetterGrade(totalScore)
  const rankBadge = myRank ? getRankBadge(myRank) : null

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="student" userName={user.fullName} />
      <main className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>
            Welcome back, {user.fullName.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Here&apos;s your academic overview
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {/* Rank */}
          <div className="stat-card" style={{ border: '1px solid rgba(245,200,66,0.2)', background: 'linear-gradient(135deg, rgba(245,200,66,0.06), rgba(247,148,79,0.04))' }}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>{rankBadge?.emoji || '📊'}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '36px', fontWeight: '800', color: '#f5c842', lineHeight: 1 }}>
              {myRank ? `#${myRank}` : '—'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Your Rank</div>
          </div>

          {/* Score */}
          <div className="stat-card">
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>📊</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '36px', fontWeight: '800', lineHeight: 1,
              background: 'var(--gradient-blue)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {totalScore.toFixed(1)}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Overall Score</div>
          </div>

          {/* Grade */}
          <div className="stat-card">
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>🎓</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '36px', fontWeight: '800', color, lineHeight: 1 }}>
              {grade}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Letter Grade</div>
          </div>

          {/* Courses */}
          <div className="stat-card">
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>📚</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '36px', fontWeight: '800', lineHeight: 1,
              background: 'var(--gradient-green)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {courses.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Enrolled Courses</div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {[
            { label: 'View Leaderboard', href: '/dashboard/student/leaderboard', icon: '🏆', color: 'var(--accent-gold)' },
            { label: 'My Full Marks', href: '/dashboard/student/marks', icon: '📊', color: 'var(--accent-blue)' },
            { label: 'My Rank Card', href: '/dashboard/student/rank', icon: '⭐', color: 'var(--accent-purple)' },
          ].map(a => (
            <Link key={a.label} href={a.href} style={{
              padding: '10px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)',
              fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>

        {/* Recent marks */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Recent Marks
          </h2>
          {recentMarks.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No marks yet. Check back after assessments are graded.</p>
            </div>
          ) : (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th>Category</th>
                    <th>Marks</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMarks.map((m: any) => {
                    const pct = m.assessment ? (m.obtained_marks / m.assessment.max_marks) * 100 : 0
                    const { grade: g, color: c } = getLetterGrade(pct)
                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{m.assessment?.title || '—'}</td>
                        <td>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600',
                            padding: '2px 8px', borderRadius: '99px', background: 'rgba(79,142,247,0.1)', color: 'var(--accent-blue)' }}>
                            {m.assessment?.category?.replace('_', ' ') || '—'}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {m.obtained_marks} / {m.assessment?.max_marks}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '80px', height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gradient-blue)', borderRadius: '99px' }} />
                            </div>
                            <span style={{ color: c, fontWeight: '600', fontSize: '13px' }}>{g}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
