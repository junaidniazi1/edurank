'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: string
}

interface SidebarProps {
  role: 'teacher' | 'student'
  userName: string
  courseCode?: string
}

const teacherNav: NavItem[] = [
  { label: 'Overview', href: '/dashboard/teacher', icon: '📊' },
  { label: 'Students', href: '/dashboard/teacher/students', icon: '👥' },
  { label: 'Assessments', href: '/dashboard/teacher/assessments', icon: '📝' },
  { label: 'Enter Marks', href: '/dashboard/teacher/marks', icon: '✏️' },
  { label: 'Leaderboard', href: '/dashboard/teacher/leaderboard', icon: '🏆' },
  { label: 'Weightage', href: '/dashboard/teacher/weightage', icon: '⚖️' },
  { label: 'Announcements', href: '/dashboard/teacher/announcements', icon: '📢' },
  { label: 'Attendance', href: '/dashboard/teacher/attendance', icon: '📅' },
  { label: 'Change Password', href: '/dashboard/teacher/change-password', icon: '🔒' },
]

const studentNav: NavItem[] = [
  { label: 'My Dashboard', href: '/dashboard/student', icon: '🏠' },
  { label: 'My Marks', href: '/dashboard/student/marks', icon: '📊' },
  { label: 'Leaderboard', href: '/dashboard/student/leaderboard', icon: '🏆' },
  { label: 'My Rank', href: '/dashboard/student/rank', icon: '⭐' },
  { label: 'Attendance', href: '/dashboard/student/attendance', icon: '📅' },
  { label: 'Announcements', href: '/dashboard/student/announcements', icon: '📢' },
  { label: 'Change Password', href: '/dashboard/student/change-password', icon: '🔒' },
]

export default function Sidebar({ role, userName }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)

  const nav = role === 'teacher' ? teacherNav : studentNav

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--gradient-blue)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
          }}>🏆</div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '16px', color: 'var(--text-primary)' }}>
              EduRank
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {role} Portal
            </div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            background: 'var(--gradient-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '700', flexShrink: 0,
            color: 'white',
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {role}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        <div style={{ padding: '4px 16px 8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Navigation
        </div>
        {nav.map(item => {
          const isActive = pathname === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: '100%',
            padding: '9px 14px',
            background: 'rgba(247,79,79,0.08)',
            border: '1px solid rgba(247,79,79,0.2)',
            borderRadius: '10px',
            color: '#f74f4f',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'Space Grotesk, sans-serif',
            transition: 'all 0.15s',
          }}
        >
          🚪 {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  )
}
