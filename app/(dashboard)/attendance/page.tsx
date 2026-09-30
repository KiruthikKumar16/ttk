import { requirePermission } from '@/lib/auth/current-profile'
import { listAttendancePage } from '@/modules/attendance/service'
import { parseCursorListQuery } from '@/modules/shared/list-query'
import { RecordList } from '@/modules/shared/components/RecordList'
import { createClient } from '@/lib/supabase/server'
import { AttendanceMarking } from '@/modules/attendance/components/AttendanceMarking'
import { getCachedCourseOptions } from '@/modules/courses/service'

export default async function AttendancePage({ searchParams }: PageProps<'/attendance'>) {
  await requirePermission('attendance', 'read')
  const params = await searchParams
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId
  const date = Array.isArray(params.date) ? params.date[0] : params.date
  const supabase = await createClient()
  const courseOptions = await getCachedCourseOptions()
  const courses = courseOptions.map((course) => ({ id: course.id, name: course.name }))
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
  return (
    <>
      <section className="panel mb-6 p-4 sm:p-6">
        <h1 className="mb-1 text-xl font-semibold">Mark attendance</h1>
        <p className="mb-4 text-sm text-muted-foreground">Choose a course and session date to load its roster.</p>
        <form action="/attendance" className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-1 text-sm">
            Course
            <select name="courseId" required defaultValue={courseId ?? ''} className="input">
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Session date
            <input
              name="date"
              type="date"
              required
              defaultValue={date ?? new Date().toISOString().slice(0, 10)}
              className="input"
            />
          </label>
          <button className="btn-primary min-h-11">Load roster</button>
        </form>
        {courseId && date && <AttendanceMarking courseId={courseId} sessionDate={date} roster={roster} />}
      </section>
      <section className="panel mb-6">
        <div className="panel-header">
          <h2>Attendance by course</h2>
          <p className="subcopy">Present sessions divided by recorded sessions, computed in Postgres.</p>
        </div>
        <div className="data-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Students</th>
                <th>Recorded sessions</th>
                <th>Present</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {(courseReports ?? []).map((row) => (
                <tr key={row.course_id}>
                  <td>{row.course_name}</td>
                  <td>{row.students}</td>
                  <td>{row.sessions}</td>
                  <td>{row.present_sessions}</td>
                  <td>{Number(row.attendance_percent).toFixed(1)}%</td>
                </tr>
              ))}
              {courseReports?.length === 0 && (
                <tr>
                  <td colSpan={5}>No attendance has been recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {courseId && (
        <section className="panel mb-6">
          <div className="panel-header">
            <h2>Student attendance</h2>
            <p className="subcopy">Up to 100 students for the selected course.</p>
          </div>
          <div className="data-wrap">
            <table>
              <thead>
                <tr>
                  <th>Register ID</th>
                  <th>Student</th>
                  <th>Sessions</th>
                  <th>Present</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {(studentReports ?? []).map((row) => (
                  <tr key={row.register_id}>
                    <td>{row.register_id}</td>
                    <td>{row.student_name}</td>
                    <td>{row.sessions}</td>
                    <td>{row.present_sessions}</td>
                    <td>{Number(row.attendance_percent).toFixed(1)}%</td>
                  </tr>
                ))}
                {studentReports?.length === 0 && (
                  <tr>
                    <td colSpan={5}>No attendance has been recorded for this course.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <RecordList
        title="Attendance records"
        description="Attendance by student and course session."
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
            <tr key={row.id}>
              <td>{row.studentId}</td>
              <td>{row.studentName}</td>
              <td>{row.courseName}</td>
              <td>{row.sessionDate}</td>
              <td>{row.status}</td>
              <td>{row.markedBy}</td>
            </tr>
          ))}
          {result.data.length === 0 && (
            <tr>
              <td colSpan={6}>No attendance records match this search.</td>
            </tr>
          )}
        </tbody>
      </RecordList>
    </>
  )
}
