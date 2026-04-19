import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

// GET /api/setup - creates demo data (run once)
// Disable this route in production!
export async function GET() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SETUP) {
    return NextResponse.json({ error: 'Setup disabled in production' }, { status: 403 })
  }

  try {
    const teacherHash = await hashPassword('demo123')
    const studentHash = await hashPassword('demo123')

    // Create teacher
    const { data: teacher } = await supabaseAdmin
      .from('users')
      .upsert({
        email: 'teacher@demo.com',
        password_hash: teacherHash,
        full_name: 'Prof. Ahmad Ali',
        role: 'teacher',
      }, { onConflict: 'email' })
      .select()
      .single()

    // Create students
    const students = [
      { email: 'student@demo.com', full_name: 'Ali Hassan', roll_number: 'CS-2021-001' },
      { email: 'fatima@demo.com', full_name: 'Fatima Malik', roll_number: 'CS-2021-002' },
      { email: 'usman@demo.com', full_name: 'Usman Ahmed', roll_number: 'CS-2021-003' },
      { email: 'ayesha@demo.com', full_name: 'Ayesha Khan', roll_number: 'CS-2021-004' },
      { email: 'bilal@demo.com', full_name: 'Bilal Nawaz', roll_number: 'CS-2021-005' },
    ]

    const createdStudents = []
    for (const s of students) {
      const { data } = await supabaseAdmin
        .from('users')
        .upsert({ ...s, password_hash: studentHash, role: 'student' }, { onConflict: 'email' })
        .select()
        .single()
      if (data) createdStudents.push(data)
    }

    // Create course
    const { data: course } = await supabaseAdmin
      .from('courses')
      .upsert({
        name: 'Data Structures & Algorithms',
        code: 'CS-301',
        description: 'Core concepts of data structures and algorithms',
        teacher_id: teacher?.id,
        semester: 'Fall',
        year: 2024,
      }, { onConflict: 'code' })
      .select()
      .single()

    if (!course) throw new Error('Course creation failed')

    // Weightage
    await supabaseAdmin.from('weightage_config').upsert({
      course_id: course.id,
      assignments: 10, quizzes: 10, mid_exam: 25,
      final_exam: 40, activities: 5, project: 5, viva: 5,
    }, { onConflict: 'course_id' })

    // Enroll students
    for (const s of createdStudents) {
      await supabaseAdmin.from('enrollments').upsert({
        student_id: s.id, course_id: course.id,
      }, { onConflict: 'student_id,course_id' })
    }

    // Create assessments
    const assessments = [
      { category: 'assignment', title: 'Assignment 1 – Arrays', max_marks: 20, is_published: true },
      { category: 'assignment', title: 'Assignment 2 – Linked Lists', max_marks: 20, is_published: true },
      { category: 'quiz', title: 'Quiz 1 – Complexity', max_marks: 15, is_published: true },
      { category: 'quiz', title: 'Quiz 2 – Trees', max_marks: 15, is_published: true },
      { category: 'mid_exam', title: 'Mid Term Exam', max_marks: 50, is_published: true },
      { category: 'activity', title: 'Lab Activity 1', max_marks: 10, is_published: true },
      { category: 'project', title: 'Final Project', max_marks: 100, is_published: true },
      { category: 'viva', title: 'Project Viva', max_marks: 30, is_published: true },
      { category: 'final_exam', title: 'Final Exam', max_marks: 100, is_published: false },
    ]

    const createdAssessments = []
    for (const a of assessments) {
      const { data } = await supabaseAdmin
        .from('assessments')
        .insert({ ...a, course_id: course.id })
        .select()
        .single()
      if (data) createdAssessments.push(data)
    }

    // Add random marks
    const sampleMarks = [
      [18, 16, 13, 12, 42, 9, 88, 25],
      [20, 18, 14, 14, 46, 10, 92, 27],
      [15, 12, 10, 9,  35, 7, 70, 20],
      [17, 15, 12, 11, 40, 8, 80, 22],
      [14, 11, 9,  8,  32, 6, 65, 18],
    ]

    for (let si = 0; si < createdStudents.length; si++) {
      const student = createdStudents[si]
      for (let ai = 0; ai < Math.min(createdAssessments.length - 1, sampleMarks[si].length); ai++) {
        const assessment = createdAssessments[ai]
        await supabaseAdmin.from('marks').upsert({
          student_id: student.id,
          assessment_id: assessment.id,
          course_id: course.id,
          obtained_marks: sampleMarks[si][ai],
          graded_at: new Date().toISOString(),
        }, { onConflict: 'student_id,assessment_id' })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data created!',
      credentials: {
        teacher: { email: 'teacher@demo.com', password: 'demo123' },
        student: { email: 'student@demo.com', password: 'demo123' },
      }
    })
  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
