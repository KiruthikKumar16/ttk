import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizeJoined } from '@/lib/supabase/relations'
import { studentFromRow, paymentFromRow } from '@/lib/server-data'
import type { Student, Payment } from '@/lib/types'

export async function getAllStudents(): Promise<Student[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('students').select('*').order('register_id', { ascending: true })
  if (error) throw error
  return (data ?? []).map(studentFromRow)
}

export async function getAllPayments(): Promise<Payment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
        id, student_id, student_register_id, method, amount, invoice, payment_date,
        transaction_id, custom_note, gst_rate, cgst, sgst,
        students!payments_student_id_fkey ( id, name )
      `,
    )
    .order('payment_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const student = normalizeJoined(row.students)
    return paymentFromRow({
      ...row,
      student_name: student?.name,
    })
  })
}

export type AttendanceReportItem = {
  id: string
  sessionDate: string
  status: 'Present' | 'Absent' | 'Late'
  studentId: string
  studentName: string
  studentRegisterId: number
  courseId: string
  courseName: string
}

export type AssessmentReportItem = {
  id: string
  title: string
  courseId: string
  courseName: string
  maxScore: number
  assessmentDate: string
  resultsCount: number
  avgScore: number
  passCount: number
  failCount: number
}

export type AcademicReportData = {
  attendanceRecords: AttendanceReportItem[]
  assessmentRecords: AssessmentReportItem[]
}

export async function getStaffAcademicReportData(): Promise<AcademicReportData> {
  const supabase = await createClient()

  const [
    { data: attendanceRows, error: attError },
    { data: assessmentRows, error: assError },
    { data: resultRows, error: resError },
  ] = await Promise.all([
    supabase
      .from('attendance')
      .select('id, session_date, status, course_id, student_id, students(register_id, name), courses(name)')
      .order('session_date', { ascending: false })
      .limit(1000),
    supabase
      .from('assessments')
      .select('id, title, max_score, assessment_date, course_id, courses(name)')
      .order('assessment_date', { ascending: false })
      .limit(100),
    supabase.from('assessment_results').select('id, assessment_id, student_id, score').limit(2000),
  ])

  if (attError) throw attError
  if (assError) throw assError
  if (resError) throw resError

  const resultsByAssessment = new Map<string, number[]>()
  for (const res of resultRows ?? []) {
    const aId = String(res.assessment_id)
    const list = resultsByAssessment.get(aId) || []
    list.push(Number(res.score))
    resultsByAssessment.set(aId, list)
  }

  const assessmentRecords: AssessmentReportItem[] = (assessmentRows ?? []).map((row: any) => {
    const course = normalizeJoined(row.courses)
    const scores = resultsByAssessment.get(String(row.id)) || []
    const resultsCount = scores.length
    const avgScore = resultsCount > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / resultsCount) : 0
    const passThreshold = Number(row.max_score) * 0.4
    const passCount = scores.filter((s) => s >= passThreshold).length
    const failCount = scores.filter((s) => s < passThreshold).length

    return {
      id: String(row.id),
      title: String(row.title),
      courseId: String(row.course_id),
      courseName: String(course?.name ?? 'Course'),
      maxScore: Number(row.max_score),
      assessmentDate: String(row.assessment_date),
      resultsCount,
      avgScore,
      passCount,
      failCount,
    }
  })

  const attendanceRecords: AttendanceReportItem[] = (attendanceRows ?? []).map((row: any) => {
    const student = normalizeJoined(row.students)
    const course = normalizeJoined(row.courses)
    return {
      id: String(row.id),
      sessionDate: String(row.session_date),
      status: row.status as 'Present' | 'Absent' | 'Late',
      studentId: String(row.student_id),
      studentName: String(student?.name ?? 'Unknown'),
      studentRegisterId: Number(student?.register_id ?? 0),
      courseId: String(row.course_id),
      courseName: String(course?.name ?? 'Course'),
    }
  })

  return {
    attendanceRecords,
    assessmentRecords,
  }
}
