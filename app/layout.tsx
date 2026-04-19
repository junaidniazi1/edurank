import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduRank — Student Leaderboard System',
  description: 'Track your academic progress, rankings, and grades in real-time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
