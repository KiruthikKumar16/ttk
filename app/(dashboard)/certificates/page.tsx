import Link from 'next/link'
import { requirePermission } from '@/lib/auth/current-profile'
import { listCertificatePage } from '@/modules/certificates/service'
import { parseListQuery } from '@/modules/shared/list-query'
import { RecordList } from '@/modules/shared/components/RecordList'
import { getCachedCourseOptions, listCourseCategories } from '@/modules/courses/service'
import { CategoryBadge } from '@/components/CategoryBadge'

export default async function CertificatesPage({ searchParams }: PageProps<'/certificates'>) {
  await requirePermission('certificates', 'read')
  const params = await searchParams
  const query = parseListQuery(params)
  const categoryId = typeof params.categoryId === 'string' && params.categoryId ? params.categoryId : undefined
  const course = typeof params.course === 'string' && params.course ? params.course : undefined

  const [result, courseOptions, categories] = await Promise.all([
    listCertificatePage({ ...query, search: query.search, categoryId, course }),
    getCachedCourseOptions(),
    listCourseCategories(),
  ])

  const courseCategoryMap = new Map(
    courseOptions.map((c) => [c.name.trim().toLowerCase(), c.categoryName]),
  )

  return (
    <RecordList
      title="Certificates"
      description="Issued completion certificates and verification links categorized by curriculum tier."
      basePath="/certificates"
      page={query.page}
      pageSize={query.pageSize}
      totalCount={result.totalCount}
      search={query.search}
      sort={query.sort}
      direction={query.direction}
      sortOptions={[
        { label: 'Issue date', value: 'issue_date' },
        { label: 'Student name', value: 'student_name' },
        { label: 'Certificate ID', value: 'certificate_id' },
      ]}
    >
      <thead>
        <tr>
          <th>Certificate</th>
          <th>Student</th>
          <th>Course</th>
          <th>Category</th>
          <th>Issue date</th>
          <th>Verify</th>
        </tr>
      </thead>
      <tbody>
        {result.data.map((certificate) => {
          const catName = courseCategoryMap.get(certificate.course_name.trim().toLowerCase())

          return (
            <tr key={certificate.id}>
              <td>
                <span className="font-mono font-medium text-slate-800">{certificate.certificate_id}</span>
              </td>
              <td>
                <Link
                  href={`/students/${certificate.student_register_id}`}
                  className="font-medium text-indigo-600 hover:underline"
                >
                  {certificate.student_name}
                </Link>
              </td>
              <td className="font-medium text-slate-800">{certificate.course_name}</td>
              <td>
                {catName ? (
                  <CategoryBadge categoryName={catName} />
                ) : (
                  <span className="text-xs text-slate-400 italic">Unassigned</span>
                )}
              </td>
              <td className="text-slate-600">{certificate.issue_date}</td>
              <td>
                {certificate.verification_code ? (
                  <Link
                    href={`/verify/${certificate.verification_code}`}
                    target="_blank"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Verify ↗
                  </Link>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          )
        })}
        {result.data.length === 0 && (
          <tr>
            <td colSpan={6}>No certificates match this search.</td>
          </tr>
        )}
      </tbody>
    </RecordList>
  )
}
