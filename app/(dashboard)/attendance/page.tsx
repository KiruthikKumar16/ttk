import { requirePermission } from '@/lib/auth/current-profile'
import { listAttendancePage } from '@/modules/attendance/service'
import { parseCursorListQuery } from '@/modules/shared/list-query'
import { RecordList } from '@/modules/shared/components/RecordList'
import { createClient } from '@/lib/supabase/server'
import { getCachedCourseOptions, listCourseCategories } from '@/modules/courses/service'
import { AttendanceClientView } from '@/modules/attendance/components/AttendanceClientView'
import Link from 'next/link'

function AttendanceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Present':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Present
        </span>
      )
    case 'Absent':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Absent
        </span>
      )
    case 'Late':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Late
        </span>
      )
    case 'Excused':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Excused
        </span>
      )
    default:
      return <span className="text-xs text-slate-600 font-medium">{status}</span>
  }
}

export default async function AttendancePage({ searchParams }: PageProps<'/attendance'>) {
  await requirePermission('attendance', 'read')
  const params = await searchParams
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId
  const date = Array.isArray(params.date) ? params.date[0] : params.date
  const supabase = await createClient()
  const [courseOptions, categories] = await Promise.all([getCachedCourseOptions(), listCourseCategories()])
  const courses = courseOptions.map((course) => ({
    id: course.id,
    name: course.name,
    categoryId: course.categoryId,
    categoryName: course.categoryName,
    duration: course.duration,
  }))
  const courseCategoryMap: Record<string, string | null | undefined> = Object.fromEntries(
    courses.map((c) => [c.id, c.categoryName]),
  )

  let roster: { registerId: number; name: string; status: string | null }[] = []
  if (courseId && date) {
    const selectedCourse = courses.find((course) => course.id === courseId)
    if (selectedCourse) {
      const [{ data: students, error: studentError }, { data: records, error: attendanceError }] = await Promise.all([
        supabase
          .from('students')
          .select('id,register_id,name')
          .eq('course', selectedCourse.name)
          .order('name')
          .limit(100),
        supabase
          .from('attendance')
          .select('student_id,status,students!attendance_student_id_fkey(register_id)')
          .eq('course_id', courseId)
          .eq('session_date', date)
          .limit(100),
      ])
      if (studentError) throw studentError
      if (attendanceError) throw attendanceError
      const statusByRegister = new Map(
        (records ?? []).map((record) => [
          Number((Array.isArray(record.students) ? record.students[0] : record.students)?.register_id),
          String(record.status),
        ]),
      )
      roster = (students ?? []).map((student) => ({
        registerId: Number(student.register_id),
        name: String(student.name),
        status: statusByRegister.get(Number(student.register_id)) ?? null,
      }))
    }
  }

  const query = parseCursorListQuery(await searchParams)
  const result = await listAttendancePage({
    ...query,
    sort: 'session_date',
    direction: 'desc',
    keyset: true,
    cursor: query.cursor,
  })

  const { data: courseReports, error: reportError } = await supabase
    .from('attendance_course_summary')
    .select('course_id,course_name,students,sessions,present_sessions,attendance_percent')
    .order('course_name')
    .limit(100)
  if (reportError) throw reportError

  const { data: studentReports, error: studentReportError } = await supabase
    .from('attendance_summary')
    .select('course_id,course_name,register_id,student_name,sessions,present_sessions,attendance_percent')
    .eq('course_id', courseId ?? '')
    .order('student_name')
    .limit(100)
  if (studentReportError) throw studentReportError

  const recordsSection = (
    <RecordList
      title="Attendance records"
      description="Attendance logs by student and course session."
      basePath="/attendance"
      page={query.page}
      pageSize={query.pageSize}
      keyset
      cursor={query.cursor}
      previousCursor={query.previousCursor}
      nextCursor={result.nextCursor}
      search={query.search}
    >
      <thead>
        <tr>
          <th>Register ID</th>
          <th>Student</th>
          <th>Course</th>
          <th>Date</th>
          <th>Status</th>
          <th>Marked by</th>
        </tr>
      </thead>
      <tbody>
        {result.data.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
            <td className="font-mono font-medium text-slate-700">
              <Link href={`/students/${row.studentId}`} className="text-indigo-600 hover:underline">
                #{row.studentId}
              </Link>
            </td>
            <td>
              <Link
                href={`/students/${row.studentId}`}
                className="font-medium text-slate-900 hover:text-indigo-600 hover:underline"
              >
                {row.studentName}
              </Link>
            </td>
            <td className="font-medium text-slate-800">{row.courseName}</td>
            <td className="font-mono text-xs text-slate-600">{row.sessionDate}</td>
            <td>
              <AttendanceStatusBadge status={row.status} />
            </td>
            <td className="text-slate-600 text-xs">{row.markedBy}</td>
          </tr>
        ))}
        {result.data.length === 0 && (
          <tr>
            <td colSpan={6} className="text-center py-6 text-slate-500">
              No attendance records match this search.
            </td>
          </tr>
        )}
      </tbody>
    </RecordList>
  )

  return (
    <AttendanceClientView
      courses={courses}
      categories={categories}
      selectedCourseId={courseId}
      selectedDate={date ?? new Date().toISOString().slice(0, 10)}
      roster={roster}
      courseReports={courseReports ?? []}
      studentReports={studentReports ?? []}
      courseCategoryMap={courseCategoryMap}
      recordsSection={recordsSection}
    />
  )
}
