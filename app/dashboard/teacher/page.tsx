import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

export default async function TeacherDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'student') redirect('/dashboard/student')

  // Fetch courses
  const { data: courses } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('teacher_id', user.userId)
    .eq('is_active', true)

  // Fetch student count
  const courseIds = courses?.map(c => c.id) || []
  let studentCount = 0
  if (courseIds.length > 0) {
    const { count } = await supabaseAdmin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .in('course_id', courseIds)
    studentCount = count || 0
  }

  // Fetch assessment count
  let assessmentCount = 0
  if (courseIds.length > 0) {
    const { count } = await supabaseAdmin
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .in('course_id', courseIds)
    assessmentCount = count || 0
  }

  const stats = [
    { label: 'Courses', value: courses?.length || 0, icon: '📚', color: 'var(--accent-blue)', gradient: 'var(--gradient-blue)' },
    { label: 'Students Enrolled', value: studentCount, icon: '👥', color: 'var(--accent-green)', gradient: 'var(--gradient-green)' },
    { label: 'Assessments', value: assessmentCount, icon: '📝', color: 'var(--accent-purple)', gradient: 'linear-gradient(135deg,#9b5ef7,#f74f9b)' },
  ]

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="teacher" userName={user.fullName} />

      <main className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>
            Good {getTimeGreeting()}, {user.fullName.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Here&apos;s what&apos;s happening with your classes today.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {stats.map(stat => (
            <div key={stat.label} className="stat-card">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: '36px', fontWeight: '800',
                background: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px', color: 'var(--text-secondary)' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { label: 'Add Student', href: '/dashboard/teacher/students', icon: '➕', color: 'var(--accent-green)' },
              { label: 'Enter Marks', href: '/dashboard/teacher/marks', icon: '✏️', color: 'var(--accent-blue)' },
              { label: 'View Leaderboard', href: '/dashboard/teacher/leaderboard', icon: '🏆', color: 'var(--accent-gold)' },
              { label: 'New Assessment', href: '/dashboard/teacher/assessments', icon: '📝', color: 'var(--accent-purple)' },
              { label: 'Set Weightage', href: '/dashboard/teacher/weightage', icon: '⚖️', color: 'var(--accent-orange)' },
            ].map(action => (
              <Link key={action.label} href={action.href} style={{
                padding: '10px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s',
              }}>
                <span>{action.icon}</span> {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Courses list */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Your Courses</h2>
            <Link href="/dashboard/teacher/courses/new" style={{
              fontSize: '13px', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '500',
            }}>
              + New Course
            </Link>
          </div>

          {!courses?.length ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No courses yet. Create your first course to get started.</p>
              <Link href="/dashboard/teacher/courses/new" style={{ display: 'inline-block', marginTop: '16px' }}>
                <button className="btn-primary">Create Course</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {courses.map(course => (
                <div key={course.id} className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
                      background: 'rgba(79,142,247,0.12)', color: 'var(--accent-blue)',
                      border: '1px solid rgba(79,142,247,0.2)',
                    }}>
                      {course.code}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {course.semester} {course.year}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{course.name}</h3>
                  {course.description && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      {course.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link href={`/dashboard/teacher/leaderboard?course=${course.id}`}
                      style={{ fontSize: '12px', color: 'var(--accent-gold)', textDecoration: 'none', padding: '4px 10px', background: 'rgba(245,200,66,0.08)', borderRadius: '6px', border: '1px solid rgba(245,200,66,0.2)' }}>
                      🏆 Leaderboard
                    </Link>
                    <Link href={`/dashboard/teacher/marks?course=${course.id}`}
                      style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none', padding: '4px 10px', background: 'rgba(79,142,247,0.08)', borderRadius: '6px', border: '1px solid rgba(79,142,247,0.2)' }}>
                      ✏️ Marks
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
