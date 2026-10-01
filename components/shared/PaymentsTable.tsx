import Link from 'next/link'
import type { Payment } from '@/lib/types'
import { money } from '@/lib/formatters'

function formatPaymentType(p: Payment, index?: number): { title: string; isFull: boolean } {
  if (p.paymentType) {
    return {
      title: p.paymentType,
      isFull: p.paymentType.toLowerCase().includes('full'),
    }
  }

  if (p.customNote && (p.customNote.includes('Part') || p.customNote.includes('Fees') || p.customNote.includes('installment'))) {
    return {
      title: p.customNote,
      isFull: p.customNote.toLowerCase().includes('full'),
    }
  }

  if (p.instanceNumber) {
    const ord =
      p.instanceNumber === 1
        ? '1st'
        : p.instanceNumber === 2
          ? '2nd'
          : p.instanceNumber === 3
            ? '3rd'
            : `${p.instanceNumber}th`
    return {
      title: `${ord} Part Fees Payment`,
      isFull: false,
    }
  }

  if (index !== undefined) {
    const num = index + 1
    const ord = num === 1 ? '1st' : num === 2 ? '2nd' : num === 3 ? '3rd' : `${num}th`
    return {
      title: `${ord} Part Fees Payment`,
      isFull: false,
    }
  }

  return { title: 'Part Fees Payment', isFull: false }
}

export function PaymentsTable({
  payments,
  onInvoice,
  compact = false,
}: {
  payments: Payment[]
  onInvoice?: (p: Payment) => void
  compact?: boolean
}) {
  return (
    <div className="data-wrap" role="region" aria-label="Payments history table" tabIndex={0}>
      <table className="w-full table-auto" style={{ whiteSpace: 'normal' }}>
        <thead>
          <tr>
            <th style={{ width: compact ? '22%' : '20%' }}>Invoice / Receipt</th>
            <th style={{ width: compact ? '30%' : '25%' }}>Payment Type / Instance</th>
            <th style={{ width: compact ? '24%' : '22%' }}>Student</th>
            {!compact && <th style={{ width: '15%' }}>Date</th>}
            <th className="align-right" style={{ width: compact ? '24%' : '18%', whiteSpace: 'nowrap' }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={compact ? 4 : 5} className="text-center py-6 text-gray-500 text-xs">
                No payment transactions recorded.
              </td>
            </tr>
          ) : (
            payments.map((p, index) => {
              const { title, isFull } = formatPaymentType(p, index)
              const invoiceUrl = `/invoices/${encodeURIComponent(p.invoice || p.id)}`

              return (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="mono" style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>
                    <Link
                      href={invoiceUrl}
                      onClick={(e) => {
                        if (onInvoice) {
                          e.preventDefault()
                          onInvoice(p)
                        }
                      }}
                      className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      title={`View invoice ${p.invoice || p.id}`}
                    >
                      {p.invoice || p.id}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                        isFull
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200/80'
                      }`}
                    >
                      {title}
                    </span>
                  </td>
                  <td>
                    <strong className="block text-gray-900 leading-snug truncate" title={p.student}>
                      {p.student}
                    </strong>
                    {compact && <small className="text-gray-400 block text-[10px]">{p.date}</small>}
                  </td>
                  {!compact && <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{p.date}</td>}
                  <td className="align-right" style={{ whiteSpace: 'nowrap' }}>
                    <span className="amount text-xs font-bold text-gray-900">{money(p.amount)}</span>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
