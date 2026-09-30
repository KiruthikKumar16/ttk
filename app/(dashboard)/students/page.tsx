import Link from 'next/link'
import { requirePermission } from '@/lib/auth/current-profile'
import { listStudentPage } from '@/modules/students/service'
import { parseListQuery } from '@/modules/shared/list-query'
import { RecordList } from '@/modules/shared/components/RecordList'

export default async function StudentsPage({ searchParams }: PageProps<'/students'>) {
  await requirePermission('students', 'read')
  const query = parseListQuery(await searchParams)
  const result = await listStudentPage({ ...query, search: query.search, sort: query.sort, direction: query.direction })
  return (
    <>
      <RecordList
        title="Students"
        description="Manage enrollment, fees, and student records."
        basePath="/students"
        page={query.page}
        pageSize={query.pageSize}
        totalCount={result.totalCount}
        search={query.search}
        sort={query.sort}
        direction={query.direction}
        sortOptions={[
          { label: 'Register ID', value: 'register_id' },
          { label: 'Name', value: 'name' },
          { label: 'Created', value: 'created_at' },
        ]}
      >
        <thead>
          <tr>
            <th>Register ID</th>
            <th>Student</th>
            <th>Course</th>
            <th>Phone</th>
            <th>Batch start</th>
            <th className="align-right">Total fees</th>
            <th className="align-right">Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {result.data.map((student) => (
            <tr key={student.registerId}>
              <td>
                <Link href={`/students/${student.registerId}`}>{student.registerId}</Link>
              </td>
              <td>
                <Link href={`/students/${student.registerId}`}>{student.name}</Link>
              </td>
              <td>{student.course}</td>
              <td>{student.phone}</td>
              <td>{student.batch}</td>
              <td className="align-right">{student.total.toLocaleString('en-IN')}</td>
              <td className="align-right">{Math.max(0, student.total - student.paid).toLocaleString('en-IN')}</td>
              <td>{student.status}</td>
            </tr>
          ))}
          {result.data.length === 0 && (
            <tr>
              <td colSpan={8}>No students match this search.</td>
            </tr>
          )}
        </tbody>
      </RecordList>
      <Link className="btn-primary mt-4 inline-block" href="/students/new">
        Add student
      </Link>
    </>
  )
}
