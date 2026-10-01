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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(`/invoices/${encodeURIComponent(payment.invoice)}`)
    }
  }

  return (
    <tr
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      className="cursor-pointer hover:bg-slate-50/80 transition-colors focus:outline-none focus:bg-slate-100"
      title={`Open invoice ${payment.invoice}`}
    >
      <td>
        <Link
          href={`/invoices/${encodeURIComponent(payment.invoice)}`}
          className="font-mono font-medium text-slate-900 hover:text-indigo-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {payment.invoice}
        </Link>
      </td>
      <td>
        <Link
          href={`/students/${payment.studentId}`}
          className="font-medium text-indigo-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {payment.student}
        </Link>
      </td>
      <td className="text-slate-800 font-medium">{courseName}</td>
      <td>
        {catName ? (
          <CategoryBadge categoryName={catName} />
        ) : (
          <span className="text-xs text-slate-400 italic">Unassigned</span>
        )}
      </td>
      <td className="text-slate-600">{payment.date}</td>
      <td>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
          {payment.method}
        </span>
      </td>
      <td className="align-right font-bold text-slate-900">{money(payment.amount)}</td>
    </tr>
  )
}
