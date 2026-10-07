'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Payment } from '@/lib/types'
import { money } from '@/lib/formatters'
import { CategoryBadge } from '@/components/CategoryBadge'

export function InvoiceTableRow({
  payment,
  courseCategoryMap,
}: {
  payment: Payment
  courseCategoryMap: Record<string, string>
}) {
  const router = useRouter()
  const courseName = payment.course || '—'
  const catName = payment.course ? courseCategoryMap[payment.course.trim().toLowerCase()] : null

  const handleRowClick = () => {
    router.push(`/invoices/${encodeURIComponent(payment.invoice)}`)
  }

  return (
    <tr
      onClick={handleRowClick}
      className="cursor-pointer hover:bg-[var(--panel)] transition-colors"
      title={`Open invoice ${payment.invoice}`}
    >
      <td className="py-3 px-4">
        <Link
          href={`/invoices/${encodeURIComponent(payment.invoice)}`}
          className="inline-flex items-center min-h-[28px] font-mono font-bold text-[var(--text)] hover:underline"
          style={{ color: 'var(--text)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {payment.invoice}
        </Link>
      </td>
      <td className="py-3 px-4">
        <Link
          href={`/students/${payment.studentId}`}
          className="inline-flex items-center min-h-[28px] font-bold hover:underline"
          style={{ color: 'var(--g1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {payment.student}
        </Link>
      </td>
      <td className="py-3 px-4 text-[var(--text)] font-medium">{courseName}</td>
      <td className="py-3 px-4">
        {catName ? (
          <CategoryBadge categoryName={catName} />
        ) : (
          <span className="text-xs text-[var(--mute)] italic">Unassigned</span>
        )}
      </td>
      <td className="py-3 px-4 text-[var(--mute)] font-mono">{payment.date}</td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-[var(--panel)] text-[var(--mute)] font-semibold border border-[var(--border)]">
          {payment.method}
        </span>
      </td>
      <td className="py-3 px-4 text-right font-bold text-[var(--text)]">{money(payment.amount)}</td>
    </tr>
  )
}
