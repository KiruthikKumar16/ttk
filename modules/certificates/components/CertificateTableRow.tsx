'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, ExternalLink, ShieldCheck } from 'lucide-react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { PillButton } from '@/components/ui/PillButton'
import { Tag } from '@/components/ui/Tag'

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

  return (
    <tr
      onClick={handleRowClick}
      className="cursor-pointer transition-colors group hover:bg-[var(--panel)]"
      style={{ borderBottom: '1px solid var(--border)' }}
      title={`Open certificate ${certificate.certificate_id}`}
    >
      <td className="py-3.5 px-5">
        <Link
          href={certTargetUrl}
          className="inline-flex items-center min-h-[28px] font-mono text-xs font-bold text-[var(--ink)] group-hover:text-[var(--g1)] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {certificate.certificate_id}
        </Link>
      </td>
      <td className="py-3.5 px-5">
        <Link
          href={`/students/${certificate.student_register_id}`}
          className="inline-flex items-center min-h-[28px] text-xs font-semibold text-[var(--ink)] hover:text-[var(--g1)] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {certificate.student_name}
        </Link>
      </td>
      <td className="py-3.5 px-5 text-xs font-medium text-[var(--ink)]">{certificate.course_name}</td>
      <td className="py-3.5 px-5">
        {categoryName ? (
          <CategoryBadge categoryName={categoryName} />
        ) : (
          <span className="text-xs text-[var(--mute)] italic">Unassigned</span>
        )}
      </td>
      <td className="py-3.5 px-5 text-xs text-[var(--mute)]">{certificate.issue_date}</td>
      <td className="py-3.5 px-5">
        {certificate.verification_code ? (
          <Link
            href={`/verify/${certificate.verification_code}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--g1)] hover:underline"
            onClick={(e) => e.stopPropagation()}
            title="Verify public certificate record"
          >
            <ShieldCheck size={13} />
            <span>Verify</span>
            <ExternalLink size={11} />
          </Link>
        ) : (
          <span className="text-xs text-[var(--mute)]">—</span>
        )}
      </td>
      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
        <Link href={certTargetUrl}>
          <PillButton variant="secondary" size="sm" icon={<Eye size={13} />}>
            View
          </PillButton>
        </Link>
      </td>
    </tr>
  )
}
