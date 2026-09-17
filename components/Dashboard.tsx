import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, CircleDollarSign, FileCheck2, FileText, LayoutDashboard, Menu, Plus, Search, Settings, ShieldCheck, Users, X, CheckCircle2, MoreHorizontal, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Payment, Receipt, Student, View } from '@/lib/types'
import { money } from '@/lib/formatters'
import { Status } from '@/components/Status'

export function Dashboard({ students, payments, setView, onInvoice }: { students: Student[]; payments: Payment[]; setView: (v: View) => void; onInvoice?: (p: Payment) => void }) {
  const revenue = students.reduce((s, x) => s + x.paid, 0);
  const outstanding = students.reduce((s, x) => s + x.total - x.paid, 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MONDAY, 15 SEPTEMBER 2026</p>
          <h1>Good morning, Admin</h1>
          <p className="subcopy">Here&apos;s what&apos;s happening across ThoorigAI Infotech.</p>
        </div>
        <Button variant="default" size="default" onClick={() => setView('Students')}>
          <Plus size={16} />
          <span className="ml-2">Add student</span>
        </Button>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-head"><span>Total students</span><Users size={17} /></div>
          <div className="stat-value">{students.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><span>Revenue collected</span><CircleDollarSign size={17} /></div>
          <div className="stat-value">{money(revenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><span>Outstanding balance</span><ArrowDownRight size={17} /></div>
          <div className="stat-value">{money(outstanding)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><span>Certificate eligible</span><ShieldCheck size={17} /></div>
          <div className="stat-value">{students.filter(s => s.status === 'Fully Paid').length}</div>
        </div>
      </div>
      <section className="panel table-panel">
        <div className="panel-header">
          <div>
            <h2>Recent payments</h2>
            <p>Latest transactions across all students</p>
          </div>
          <Button variant="default" size="default" onClick={() => setView('Invoices')}>
            View all
            <ArrowUpRight size={14} />
          </Button>
        </div>
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
      </section>
    </>
  );
}