'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, ExternalLink } from 'lucide-react'
import { CategoryBadge } from '@/components/CategoryBadge'

export interface CertificateRowItem {
  id: string
  certificate_id: string
  student_register_id: number
  student_name: string
  course_name: string
  issue_date: string
  verification_code?: string | null
}

export function CertificateTableRow({
  certificate,
  categoryName,
}: {
  certificate: CertificateRowItem
  categoryName?: string | null
}) {
  const router = useRouter()
  const certTargetUrl = `/certificates/${encodeURIComponent(certificate.certificate_id || certificate.id)}`

  const handleRowClick = () => {
    router.push(certTargetUrl)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(certTargetUrl)
    }
  }

  return (
    <tr
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      className="cursor-pointer hover:bg-slate-50/80 transition-colors focus:outline-none focus:bg-slate-100 group"
      title={`Open certificate ${certificate.certificate_id}`}
    >
      <td>
        <Link
          href={certTargetUrl}
          className="font-mono font-medium text-slate-900 group-hover:text-indigo-600 group-hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {certificate.certificate_id}
        </Link>
      </td>
      <td>
        <Link
          href={`/students/${certificate.student_register_id}`}
          className="font-medium text-indigo-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {certificate.student_name}
        </Link>
      </td>
      <td className="font-medium text-slate-800">{certificate.course_name}</td>
      <td>
        {categoryName ? (
          <CategoryBadge categoryName={categoryName} />
        ) : (
          <span className="text-xs text-slate-600 italic">Unassigned</span>
        )}
      </td>
      <td className="text-slate-600">{certificate.issue_date}</td>
      <td>
        {certificate.verification_code ? (
          <Link
            href={`/verify/${certificate.verification_code}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => e.stopPropagation()}
            title="Verify public certificate record"
          >
            <span>Verify</span>
            <ExternalLink size={12} />
          </Link>
        ) : (
          '—'
        )}
      </td>
      <td className="text-right" onClick={(e) => e.stopPropagation()}>
        <Link
          href={certTargetUrl}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-md shadow-2xs transition-colors"
          title="View & Print Certificate"
        >
          <Eye size={13} />
          <span>View</span>
        </Link>
      </td>
    </tr>
  )
}
