import Link from 'next/link'
import { requirePermission } from '@/lib/auth/current-profile'
import { listCertificatePage } from '@/modules/certificates/service'
import { parseListQuery } from '@/modules/shared/list-query'
import { RecordList } from '@/modules/shared/components/RecordList'

export default async function CertificatesPage({ searchParams }: PageProps<'/certificates'>) {
  await requirePermission('certificates', 'read')
  const query = parseListQuery(await searchParams)
  const result = await listCertificatePage({ ...query, search: query.search })
  return (
    <RecordList
      title="Certificates"
      description="Issued completion certificates and verification links."
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
          <th>Issue date</th>
          <th>Verify</th>
        </tr>
      </thead>
      <tbody>
        {result.data.map((certificate) => (
          <tr key={certificate.id}>
            <td>{certificate.certificate_id}</td>
            <td>
              <Link href={`/students/${certificate.student_register_id}`}>{certificate.student_name}</Link>
            </td>
            <td>{certificate.course_name}</td>
            <td>{certificate.issue_date}</td>
            <td>
              {certificate.verification_code ? (
                <Link href={`/verify/${certificate.verification_code}`} target="_blank">
                  Verify
                </Link>
              ) : (
                '—'
              )}
            </td>
          </tr>
        ))}
        {result.data.length === 0 && (
          <tr>
            <td colSpan={5}>No certificates match this search.</td>
          </tr>
        )}
      </tbody>
    </RecordList>
  )
}
