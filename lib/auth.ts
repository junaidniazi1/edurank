import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'

export interface JWTPayload {
  userId: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  fullName: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    // Dynamic import so next/headers is only loaded server-side
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

export function getLetterGrade(score: number): { grade: string; gpa: number; color: string } {
  if (score >= 90) return { grade: 'A+', gpa: 4.0, color: '#22c55e' }
  if (score >= 85) return { grade: 'A', gpa: 4.0, color: '#22c55e' }
  if (score >= 80) return { grade: 'A-', gpa: 3.7, color: '#86efac' }
  if (score >= 75) return { grade: 'B+', gpa: 3.3, color: '#60a5fa' }
  if (score >= 70) return { grade: 'B', gpa: 3.0, color: '#60a5fa' }
  if (score >= 65) return { grade: 'B-', gpa: 2.7, color: '#93c5fd' }
  if (score >= 60) return { grade: 'C+', gpa: 2.3, color: '#fbbf24' }
  if (score >= 55) return { grade: 'C', gpa: 2.0, color: '#fbbf24' }
  if (score >= 50) return { grade: 'C-', gpa: 1.7, color: '#f59e0b' }
  if (score >= 45) return { grade: 'D', gpa: 1.0, color: '#f97316' }
  return { grade: 'F', gpa: 0.0, color: '#ef4444' }
}

export function getRankBadge(rank: number): { emoji: string; color: string; label: string } {
  if (rank === 1) return { emoji: '🥇', color: '#FFD700', label: '1st Place' }
  if (rank === 2) return { emoji: '🥈', color: '#C0C0C0', label: '2nd Place' }
  if (rank === 3) return { emoji: '🥉', color: '#CD7F32', label: '3rd Place' }
  if (rank <= 10) return { emoji: '⭐', color: '#a78bfa', label: `#${rank}` }
  return { emoji: '📚', color: '#6b7280', label: `#${rank}` }
}
