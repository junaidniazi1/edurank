import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let courses

    if (user.role === 'teacher' || user.role === 'admin') {
      const { data, error } = await supabaseAdmin
        .from('courses')
        .select('*, teacher:users!courses_teacher_id_fkey(full_name)')
        .eq('teacher_id', user.userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      courses = data
    } else {
      // Student - get enrolled courses
      const { data: enrollments, error } = await supabaseAdmin
        .from('enrollments')
        .select('course_id, courses(*)')
        .eq('student_id', user.userId)

      if (error) throw error
      courses = enrollments?.map((e: any) => e.courses) || []
    }

    return NextResponse.json({ courses })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { name, code, description, semester, year } = await req.json()

    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({ name, code, description, semester, year, teacher_id: user.userId })
      .select()
      .single()

    if (error) throw error

    // Create default weightage config
    await supabaseAdmin.from('weightage_config').insert({
      course_id: data.id,
      assignments: 10, quizzes: 10, mid_exam: 25,
      final_exam: 40, activities: 5, project: 5, viva: 5
    })

    return NextResponse.json({ success: true, course: data }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
