'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

interface Course { id: string; name: string; code: string }
interface Assessment { id: string; title: string; category: string; max_marks: number }
interface Student { id: string; full_name: string; roll_number: string }
interface MarkEntry { studentId: string; obtainedMarks: string; feedback: string }

const CATEGORY_COLORS: Record<string, string> = {
  assignment: '#4f8ef7', quiz: '#9b5ef7', mid_exam: '#f5c842',
  final_exam: '#f74f4f', activity: '#3dd68c', project: '#f7944f', viva: '#f74fa1',
}

export default function MarksPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userName, setUserName] = useState('Teacher')

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(d => {
      if (d.courses) { setCourses(d.courses); if (d.courses[0]) setSelectedCourse(d.courses[0].id) }
    })
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.fullName) setUserName(d.fullName) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    fetch(`/api/assessments?courseId=${selectedCourse}`).then(r => r.json()).then(d => {
      setAssessments(d.assessments || [])
      setSelectedAssessment('')
    })
    fetch(`/api/students?courseId=${selectedCourse}`).then(r => r.json()).then(d => {
      setStudents(d.students || [])
      setMarks({})
    })
  }, [selectedCourse])

  useEffect(() => {
    if (!selectedAssessment || !selectedCourse) return
    // Load existing marks
    fetch(`/api/marks?courseId=${selectedCourse}`).then(r => r.json()).then(d => {
      const existing: Record<string, MarkEntry> = {}
      d.marks?.forEach((m: any) => {
        if (m.assessment_id === selectedAssessment) {
          existing[m.student_id] = {
            studentId: m.student_id,
            obtainedMarks: m.obtained_marks?.toString() || '',
            feedback: m.feedback || '',
          }
        }
      })
      setMarks(existing)
    })
  }, [selectedAssessment, selectedCourse])

  async function handleSave() {
    if (!selectedAssessment || !selectedCourse) return
    setSaving(true)

    const marksArray = students
      .filter(s => marks[s.id]?.obtainedMarks !== '')
      .map(s => ({
        studentId: s.id,
        assessmentId: selectedAssessment,
        courseId: selectedCourse,
        obtainedMarks: parseFloat(marks[s.id]?.obtainedMarks || '0'),
        feedback: marks[s.id]?.feedback || '',
      }))

    const res = await fetch('/api/marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marks: marksArray }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  function fillAll(value: string) {
    const newMarks: Record<string, MarkEntry> = {}
    students.forEach(s => {
      newMarks[s.id] = { studentId: s.id, obtainedMarks: value, feedback: marks[s.id]?.feedback || '' }
    })
    setMarks(newMarks)
  }

  const selectedAssessmentObj = assessments.find(a => a.id === selectedAssessment)
  const filledCount = Object.values(marks).filter(m => m.obtainedMarks !== '').length

  return (
    <div style={{ display: 'flex', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar role="teacher" userName={userName} />
      <main className="main-content">
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800' }}>✏️ Enter Marks</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Select a course and assessment to update student marks
          </p>
        </div>

        {/* Filters */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Course
            </label>
            <select className="input-dark" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              <option value="">Select course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Assessment
            </label>
            <select className="input-dark" value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)} disabled={!selectedCourse}>
              <option value="">Select assessment...</option>
              {assessments.map(a => (
                <option key={a.id} value={a.id}>
                  [{a.category.replace('_', ' ').toUpperCase()}] {a.title} (/{a.max_marks})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Marks table */}
        {selectedAssessment && students.length > 0 && (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
                    background: `rgba(${hexToRgb(CATEGORY_COLORS[selectedAssessmentObj?.category || ''] || '#4f8ef7')},0.12)`,
                    color: CATEGORY_COLORS[selectedAssessmentObj?.category || ''] || '#4f8ef7',
                    border: `1px solid rgba(${hexToRgb(CATEGORY_COLORS[selectedAssessmentObj?.category || ''] || '#4f8ef7')},0.25)`,
                    textTransform: 'uppercase',
                  }}>
                    {selectedAssessmentObj?.category?.replace('_', ' ')}
                  </span>
                  <span style={{ fontWeight: '600', fontSize: '15px' }}>{selectedAssessmentObj?.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Max: {selectedAssessmentObj?.max_marks}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {filledCount}/{students.length} marks entered
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => fillAll('')} style={{ fontSize: '12px', padding: '7px 12px' }}>
                  Clear All
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving || filledCount === 0}
                  style={{ fontSize: '13px' }}
                >
                  {saving ? 'Saving...' : saved ? '✅ Saved!' : `Save ${filledCount} Marks`}
                </button>
              </div>
            </div>

            <table className="table-dark">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th style={{ width: '160px' }}>Marks (/{selectedAssessmentObj?.max_marks})</th>
                  <th>Feedback (optional)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const mark = marks[student.id] || { obtainedMarks: '', feedback: '' }
                  const val = parseFloat(mark.obtainedMarks)
                  const max = selectedAssessmentObj?.max_marks || 100
                  const pct = isNaN(val) ? 0 : (val / max) * 100
                  const isOver = val > max

                  return (
                    <tr key={student.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{idx + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent-blue)' }}>
                        {student.roll_number}
                      </td>
                      <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{student.full_name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            min="0"
                            max={max}
                            step="0.5"
                            className="input-dark"
                            value={mark.obtainedMarks}
                            style={{
                              width: '90px',
                              borderColor: isOver ? 'var(--accent-red)' : mark.obtainedMarks ? 'var(--accent-green)' : undefined,
                            }}
                            onChange={e => setMarks(prev => ({
                              ...prev,
                              [student.id]: { ...prev[student.id] || {}, studentId: student.id, obtainedMarks: e.target.value, feedback: prev[student.id]?.feedback || '' }
                            }))}
                          />
                          {mark.obtainedMarks && !isOver && (
                            <span style={{
                              fontSize: '11px', fontWeight: '600', minWidth: '36px',
                              color: pct >= 80 ? 'var(--accent-green)' : pct >= 60 ? 'var(--accent-blue)' : pct >= 40 ? 'var(--accent-gold)' : 'var(--accent-red)',
                            }}>
                              {pct.toFixed(0)}%
                            </span>
                          )}
                          {isOver && <span style={{ fontSize: '11px', color: 'var(--accent-red)' }}>Over max!</span>}
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input-dark"
                          placeholder="Optional feedback..."
                          value={mark.feedback}
                          style={{ fontSize: '13px' }}
                          onChange={e => setMarks(prev => ({
                            ...prev,
                            [student.id]: { ...prev[student.id] || {}, studentId: student.id, feedback: e.target.value, obtainedMarks: prev[student.id]?.obtainedMarks || '' }
                          }))}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedCourse && selectedAssessment && students.length === 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No students enrolled in this course yet.</p>
          </div>
        )}

        {selectedCourse && !selectedAssessment && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
            <p style={{ color: 'var(--text-muted)' }}>Select an assessment above to start entering marks.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
