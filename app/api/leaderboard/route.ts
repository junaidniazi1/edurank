import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  try {
    // Get all enrolled students
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('student_id, users!enrollments_student_id_fkey(id, full_name, roll_number, avatar_url)')
      .eq('course_id', courseId)

    if (!enrollments) return NextResponse.json({ leaderboard: [] })

    // Get weightage config
    const { data: weightage } = await supabaseAdmin
      .from('weightage_config')
      .select('*')
      .eq('course_id', courseId)
      .single()

    const weights = weightage || {
      assignments: 10, quizzes: 10, mid_exam: 25,
      final_exam: 40, activities: 5, project: 5, viva: 5
    }

    // Get all assessments for this course
    const { data: assessments } = await supabaseAdmin
      .from('assessments')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_published', true)

    // Get all marks for this course
    const { data: allMarks } = await supabaseAdmin
      .from('marks')
      .select('*')
      .eq('course_id', courseId)

    // Calculate scores for each student
    const scores = enrollments.map((enrollment: any) => {
      const studentId = enrollment.student_id
      const studentMarks = allMarks?.filter(m => m.student_id === studentId) || []

      const categoryScores: Record<string, { obtained: number; max: number; count: number }> = {}

      assessments?.forEach(assessment => {
        const mark = studentMarks.find(m => m.assessment_id === assessment.id)
        const cat = assessment.category

        if (!categoryScores[cat]) {
          categoryScores[cat] = { obtained: 0, max: 0, count: 0 }
        }

        categoryScores[cat].max += assessment.max_marks
        categoryScores[cat].count += 1

        if (mark?.obtained_marks != null) {
          categoryScores[cat].obtained += mark.obtained_marks
        }
      })

      // Calculate weighted total
      const categoryMap: Record<string, string> = {
        assignment: 'assignments',
        quiz: 'quizzes',
        mid_exam: 'mid_exam',
        final_exam: 'final_exam',
        activity: 'activities',
        project: 'project',
        viva: 'viva',
      }

      let totalScore = 0
      let totalWeight = 0
      const breakdown: Record<string, number> = {}

      Object.entries(categoryMap).forEach(([dbCat, weightKey]) => {
        const catScore = categoryScores[dbCat]
        const weight = (weights as any)[weightKey] || 0

        if (catScore && catScore.max > 0) {
          const pct = (catScore.obtained / catScore.max) * 100
          totalScore += (pct * weight) / 100
          totalWeight += weight
          breakdown[weightKey] = Math.round(pct * 10) / 10
        } else {
          breakdown[weightKey] = 0
        }
      })

      const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0

      return {
        studentId,
        fullName: enrollment.users?.full_name || '',
        rollNumber: enrollment.users?.roll_number || '',
        avatarUrl: enrollment.users?.avatar_url,
        score: Math.round(finalScore * 100) / 100,
        breakdown,
        marksCount: studentMarks.filter(m => m.obtained_marks != null).length,
        totalAssessments: assessments?.length || 0,
      }
    })

    // Sort by score descending and add ranks
    scores.sort((a, b) => b.score - a.score)

    let rank = 1
    const leaderboard = scores.map((s, idx) => {
      if (idx > 0 && s.score < scores[idx - 1].score) rank = idx + 1
      return { ...s, rank }
    })

    return NextResponse.json({ leaderboard, weights })
  } catch (err) {
    console.error('Leaderboard error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
