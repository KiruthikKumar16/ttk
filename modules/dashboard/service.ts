import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { InternalError } from '@/lib/http/errors'
import type { DashboardSummary } from '@/modules/dashboard/types'
import { listPayments } from '@/lib/server-data'

function safeInteger(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new InternalError('Dashboard summary returned invalid totals.')
  return parsed
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_dashboard_summary')
  if (error) throw new InternalError('Unable to load dashboard summary.')
  if (!data || typeof data !== 'object') throw new InternalError('Dashboard summary is unavailable.')
  const summary = data as Record<string, unknown>
  const courseMix = Array.isArray(summary.courseMix)
    ? summary.courseMix.map((entry) => {
        if (!entry || typeof entry !== 'object') throw new InternalError('Dashboard course mix is invalid.')
        const row = entry as Record<string, unknown>
        return { course: String(row.course), studentCount: safeInteger(row.studentCount) }
      })
    : []
  return {
    studentCount: safeInteger(summary.studentCount),
    revenuePaise: safeInteger(summary.revenuePaise),
    outstandingPaise: safeInteger(summary.outstandingPaise),
    eligibleCount: safeInteger(summary.eligibleCount),
    monthlyRevenuePaise: safeInteger(summary.monthlyRevenuePaise),
    courseMix,
  }
}

export async function getDashboardSummaryForPeriod(startDate: string, endDate: string): Promise<DashboardSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_dashboard_summary_for_period', {
    p_start_date: startDate,
    p_end_date: endDate,
  })
  if (error) throw new InternalError('Unable to load the date-range report.')
  if (!data || typeof data !== 'object') throw new InternalError('Date-range report is unavailable.')
  const summary = data as Record<string, unknown>
  const courseMix = Array.isArray(summary.courseMix)
    ? summary.courseMix.map((entry) => {
        if (!entry || typeof entry !== 'object') throw new InternalError('Report course mix is invalid.')
        const row = entry as Record<string, unknown>
        return { course: String(row.course), studentCount: safeInteger(row.studentCount) }
      })
    : []
  return {
    studentCount: safeInteger(summary.studentCount),
    revenuePaise: safeInteger(summary.revenuePaise),
    outstandingPaise: safeInteger(summary.outstandingPaise),
    eligibleCount: safeInteger(summary.eligibleCount),
    monthlyRevenuePaise: safeInteger(summary.monthlyRevenuePaise),
    courseMix,
  }
}

export async function getRecentPayments() {
  const supabase = await createClient()
  return listPayments(supabase, { page: 1, pageSize: 5 })
}

export type StaffDashboardData = {
  totalStudents: number
  activeStudents: number
  todayAttendance: {
    totalMarked: number
    present: number
    absent: number
    rate: number
  }
  materialsCount: number
  assessmentCount: number
  recentAssessments: Array<{
    id: string
    title: string
    courseId: string
    courseName: string
    maxScore: number
    assessmentDate: string
  }>
  lowAttendanceStudents: Array<{
    id: string
    registerId: number
    name: string
    course: string
    phone: string | null
    totalSessions: number
    presentSessions: number
    rate: number
  }>
  categoryMix: Array<{
    id: string
    name: string
    duration: string
    courseNames: string[]
    studentCount: number
  }>
}

export async function getStaffDashboardData(): Promise<StaffDashboardData> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: students, count: studentCount },
    { data: todayAttendance },
    { data: allAttendance },
    { data: assessments, count: assessmentCount },
    { count: materialsCount },
    { data: categoriesData },
    { data: coursesData },
  ] = await Promise.all([
    supabase.from('students').select('id, register_id, name, course, status, phone').order('register_id'),
    supabase.from('attendance').select('id, status, course_id, student_id').eq('session_date', today),
    supabase.from('attendance').select('student_id, status'),
    supabase
      .from('assessments')
      .select('id, title, course_id, max_score, assessment_date, courses(name)')
      .order('assessment_date', { ascending: false })
      .limit(6),
    supabase.from('course_materials').select('*', { count: 'exact', head: true }),
    supabase.from('course_categories').select('id, name, duration').order('name'),
    supabase.from('courses').select('id, name, duration, category_id'),
  ])

  const studentAttendanceMap = new Map<string, { total: number; present: number }>()
  for (const record of allAttendance ?? []) {
    const sId = String(record.student_id)
    const current = studentAttendanceMap.get(sId) || { total: 0, present: 0 }
    current.total += 1
    if (record.status === 'Present' || record.status === 'Late') current.present += 1
    studentAttendanceMap.set(sId, current)
  }

  const lowAttendanceStudents = (students ?? [])
    .map((s) => {
      const stats = studentAttendanceMap.get(String(s.id))
      const rate = stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : null
      return {
        id: String(s.id),
        registerId: Number(s.register_id),
        name: String(s.name),
        course: String(s.course),
        phone: s.phone ? String(s.phone) : null,
        totalSessions: stats?.total ?? 0,
        presentSessions: stats?.present ?? 0,
        rate: rate ?? 100,
      }
    })
    .filter((s) => s.rate < 75 && s.totalSessions > 0)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 10)

  const todayPresent = (todayAttendance ?? []).filter((a) => a.status === 'Present' || a.status === 'Late').length
  const todayAbsent = (todayAttendance ?? []).filter((a) => a.status === 'Absent').length
  const todayTotal = (todayAttendance ?? []).length
  const todayRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0

  const mappedAssessments = (assessments ?? []).map((a: any) => ({
    id: String(a.id),
    title: String(a.title),
    courseId: String(a.course_id),
    courseName: String(a.courses?.name ?? 'Course'),
    maxScore: Number(a.max_score),
    assessmentDate: String(a.assessment_date),
  }))

  const fallbackCategories = [
    { id: 'c0000000-0000-0000-0000-000000000001', name: 'Essential', duration: '6 weeks' },
    { id: 'c0000000-0000-0000-0000-000000000002', name: 'Elite', duration: '12 weeks' },
    { id: 'c0000000-0000-0000-0000-000000000003', name: 'Internship', duration: '3 Months' },
  ]

  const catList = ((categoriesData && categoriesData.length > 0 ? categoriesData : fallbackCategories) as any[]).map(
    (c) => ({
      id: String(c.id),
      name: String(c.name),
      duration: String(c.duration),
    }),
  )

  const courseList = ((coursesData ?? []) as any[]).map((c) => ({
    id: String(c.id),
    name: String(c.name),
    duration: String(c.duration || ''),
    categoryId: c.category_id ? String(c.category_id) : null,
  }))

  const courseToCatMap = new Map<string, { id: string; name: string }>()
  for (const c of courseList) {
    const cat = catList.find((item) => item.id === c.categoryId)
    if (cat) {
      courseToCatMap.set(c.name.toLowerCase().trim(), { id: cat.id, name: cat.name })
    }
  }

  const categoryMix = catList.map((cat) => {
    const isInternship = cat.name.toLowerCase().includes('internship')
    const isElite = cat.name.toLowerCase().includes('elite')

    const catCourses = courseList.filter((c) => {
      if (c.categoryId === cat.id) return true
      if (isInternship && c.name.toLowerCase().includes('internship')) return true
      if (!c.categoryId && isElite && (c.duration.includes('month') || c.duration.includes('12'))) return true
      return false
    })
    const catCourseNames = Array.from(new Set(catCourses.map((c) => c.name)))

    const count = (students ?? []).filter((s) => {
      if (!s.course) return false
      const sCourse = String(s.course).trim().toLowerCase()
      if (catCourseNames.some((cn) => cn.trim().toLowerCase() === sCourse)) return true
      const mapped = courseToCatMap.get(sCourse)
      if (mapped && mapped.id === cat.id) return true
      if (isInternship && sCourse.includes('internship')) return true
      if (
        !mapped &&
        isElite &&
        (sCourse.includes('professional') || sCourse.includes('crash') || sCourse.includes('slash'))
      )
        return true
      return false
    }).length

    ;(students ?? []).forEach((s) => {
      if (!s.course) return
      const sCourse = String(s.course).trim()
      const sCourseLower = sCourse.toLowerCase()
      if (isInternship && sCourseLower.includes('internship') && !catCourseNames.includes(sCourse)) {
        catCourseNames.push(sCourse)
      } else if (
        isElite &&
        (sCourseLower.includes('professional') || sCourseLower.includes('crash') || sCourseLower.includes('slash')) &&
        !catCourseNames.includes(sCourse)
      ) {
        catCourseNames.push(sCourse)
      }
    })

    return {
      id: cat.id,
      name: cat.name,
      duration: cat.duration,
      courseNames: catCourseNames,
      studentCount: count,
    }
  })

  return {
    totalStudents: studentCount ?? (students?.length || 0),
    activeStudents: (students ?? []).length,
    todayAttendance: {
      totalMarked: todayTotal,
      present: todayPresent,
      absent: todayAbsent,
      rate: todayRate,
    },
    materialsCount: materialsCount ?? 0,
    assessmentCount: assessmentCount ?? 0,
    recentAssessments: mappedAssessments,
    lowAttendanceStudents,
    categoryMix,
  }
}
