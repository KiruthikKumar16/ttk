import { Button } from '@/components/ui/button'
import type { Payment } from '@/lib/types'
import { money } from '@/lib/formatters'

export function PaymentsTable({ payments, onInvoice }: { payments: Payment[]; onInvoice?: (p: Payment) => void }) {
  return (
    <div className="data-wrap">
      <table>
        <thead>
          <tr>
            <th>Receipt ID</th>
            <th>Student</th>
            <th>Method</th>
            <th>Date</th>
            <th className="align-right">Amount</th>
            <th>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id}>
              <td className="mono">{p.id}</td>
              <td><strong>{p.student}</strong></td>
              <td><span className="method">{p.method}</span></td>
              <td>{p.date}</td>
              <td className="align-right amount">{money(p.amount)}</td>
              <td>
                <Button
                  variant="default"
                  size="default"
                  className="row-link"
                  onClick={() =>
                    onInvoice
                      ? onInvoice(p)
                      : window.location.assign('/api/invoices/' + encodeURIComponent(p.invoice) + '/download')
                  }
                >
                  {p.invoice}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}