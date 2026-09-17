import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, CircleDollarSign, FileCheck2, FileText, LayoutDashboard, Menu, Plus, Search, Settings, ShieldCheck, Users, X, CheckCircle2, MoreHorizontal, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Payment, Receipt, Student, View } from '@/lib/types'
import { money } from '@/lib/formatters'
import { Status } from '@/components/Status'
import { PaymentsTable } from '@/components/PaymentsTable'
export function Dashboard({ students, payments, onInvoice, setView }: { students: Student[]; payments: Payment[]; onInvoice: (id: string) => void; setView: (view: View) => void; }) {
  const revenue = students.reduce((s, x) => s + x.paid, 0);
  const outstanding = students.reduce((s, x) => s + x.total - x.paid, 0);
  // Lead analytics
  const leadSourceCounts = students.reduce((acc, s) => {
    const src = s.leadSource || 'Unknown';
    acc[src] = (acc[src] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const leadTypeCounts = students.reduce((acc, s) => {
    const type = s.leadType || 'Unknown';
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MONDAY, 15 SEPTEMBER 2026</p>
          <h1>Good morning, Admin</h1>
          <p className="subcopy">Here&rsquo;s what&rsquo;s happening across ThoorigAI Infotech.</p>
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
        {/* Lead Source Card */}
        <div className="stat-card">
          <div className="stat-head"><span>Leads by Source</span><BarChart3 size={17} /></div>
          <div className="stat-value">
            {Object.entries(leadSourceCounts).map(([src, cnt]) => (
              <div key={src} className="lead-item">
                <span>{src}</span>: <strong>{cnt}</strong>
              </div>
            ))}
          </div>
        </div>
        {/* Lead Type Card */}
        <div className="stat-card">
          <div className="stat-head"><span>Leads by Type</span><BarChart3 size={17} /></div>
          <div className="stat-value">
            {Object.entries(leadTypeCounts).map(([type, cnt]) => (
              <div key={type} className="lead-item">
                <span>{type}</span>: <strong>{cnt}</strong>
              </div>
            ))}
          </div>
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
        <PaymentsTable payments={payments.slice(0, 5)} onInvoice={onInvoice} />
      </section>
    </>
  );
}
