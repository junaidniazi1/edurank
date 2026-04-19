import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser, hashPassword } from '@/lib/auth'

// POST /api/students - create new student (teacher only)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { fullName, email, rollNumber, password, courseId } = await req.json()

    if (!fullName || !email || !rollNumber || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    // Create user
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: 'student',
        roll_number: rollNumber,
      })
      .select()
      .single()

    if (userError) {
      if (userError.code === '23505') {
        return NextResponse.json({ error: 'Email or roll number already exists' }, { status: 409 })
      }
      throw userError
    }

    // Enroll in course if provided
    if (courseId) {
      await supabaseAdmin.from('enrollments').insert({
        student_id: newUser.id,
        course_id: courseId,
      })
    }

    return NextResponse.json({ success: true, student: newUser }, { status: 201 })
  } catch (err) {
    console.error('Create student error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/students - list students (teacher only)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  try {
    let query = supabaseAdmin
      .from('users')
      .select('id, full_name, email, roll_number, is_active, created_at')
      .eq('role', 'student')
      .order('full_name')

    if (courseId) {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('student_id')
        .eq('course_id', courseId)

      const studentIds = enrollments?.map(e => e.student_id) || []
      if (studentIds.length === 0) return NextResponse.json({ students: [] })
      query = query.in('id', studentIds)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ students: data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
