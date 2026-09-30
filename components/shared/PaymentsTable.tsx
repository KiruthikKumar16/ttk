import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Payment } from '@/lib/types'
import { money } from '@/lib/formatters'

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
    <div className="data-wrap">
      <table className="w-full table-auto" style={{ whiteSpace: 'normal' }}>
        <thead>
          <tr>
            <th style={{ width: compact ? '25%' : '20%' }}>Receipt</th>
            <th style={{ width: compact ? '25%' : '26%' }}>Student</th>
            {!compact && <th style={{ width: '18%' }}>Date</th>}
            <th className="align-right" style={{ width: compact ? '25%' : '18%', whiteSpace: 'nowrap' }}>
              Amount
            </th>
            <th className="align-right" style={{ width: compact ? '25%' : '18%', whiteSpace: 'nowrap' }}>
              Action
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
            payments.map((p) => (
              <tr key={p.id}>
                <td className="mono" style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>
                  {p.id}
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
                <td className="align-right" style={{ whiteSpace: 'nowrap' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-ghost text-xs px-2.5 py-1"
                    onClick={() =>
                      onInvoice
                        ? onInvoice(p)
                        : window.location.assign('/api/invoices/' + encodeURIComponent(p.invoice) + '/download')
                    }
                    title="View Invoice"
                  >
                    <Eye size={13} className="mr-1" />
                    View
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
