import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

// POST /api/marks - update/set marks (teacher only)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { marks } = await req.json()
    // marks: Array<{ studentId, assessmentId, courseId, obtainedMarks, feedback }>

    if (!Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json({ error: 'Marks array required' }, { status: 400 })
    }

    const upsertData = marks.map((m: {
      studentId: string
      assessmentId: string
      courseId: string
      obtainedMarks: number
      feedback?: string
    }) => ({
      student_id: m.studentId,
      assessment_id: m.assessmentId,
      course_id: m.courseId,
      obtained_marks: m.obtainedMarks,
      feedback: m.feedback || null,
      graded_at: new Date().toISOString(),
      graded_by: user.userId,
    }))

    const { data, error } = await supabaseAdmin
      .from('marks')
      .upsert(upsertData, { onConflict: 'student_id,assessment_id' })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, updated: data?.length })
  } catch (err) {
    console.error('Marks error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/marks?studentId=&courseId=
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  const studentId = searchParams.get('studentId') || (user.role === 'student' ? user.userId : null)

  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  // Students can only see their own marks
  if (user.role === 'student' && studentId !== user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    let query = supabaseAdmin
      .from('marks')
      .select(`
        *,
        assessment:assessments(id, title, category, max_marks, due_date),
        student:users!marks_student_id_fkey(id, full_name, roll_number)
      `)
      .eq('course_id', courseId)

    if (studentId) query = query.eq('student_id', studentId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ marks: data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
