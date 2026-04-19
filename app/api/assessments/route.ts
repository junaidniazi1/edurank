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
    let query = supabaseAdmin
      .from('assessments')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (user.role === 'student') {
      query = query.eq('is_published', true)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ assessments: data })
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
    const { courseId, category, title, maxMarks, dueDate, description, isPublished } = await req.json()

    const { data, error } = await supabaseAdmin
      .from('assessments')
      .insert({
        course_id: courseId,
        category,
        title,
        max_marks: maxMarks,
        due_date: dueDate || null,
        description: description || null,
        is_published: isPublished ?? false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, assessment: data }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { id, ...updates } = await req.json()

    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.maxMarks !== undefined) dbUpdates.max_marks = updates.maxMarks
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished

    const { data, error } = await supabaseAdmin
      .from('assessments')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, assessment: data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
