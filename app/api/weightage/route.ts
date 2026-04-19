import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('weightage_config')
    .select('*')
    .eq('course_id', courseId)
    .single()

  if (error) {
    // Return defaults if not found
    return NextResponse.json({
      config: {
        assignments: 10, quizzes: 10, mid_exam: 25,
        final_exam: 40, activities: 5, project: 5, viva: 5
      }
    })
  }

  return NextResponse.json({ config: data })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { courseId, assignments, quizzes, mid_exam, final_exam, activities, project, viva } = await req.json()

    const total = assignments + quizzes + mid_exam + final_exam + activities + project + viva
    if (Math.abs(total - 100) > 0.01) {
      return NextResponse.json({ error: `Weightages must sum to 100 (got ${total})` }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('weightage_config')
      .upsert({
        course_id: courseId,
        assignments, quizzes, mid_exam, final_exam, activities, project, viva,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'course_id' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, config: data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
