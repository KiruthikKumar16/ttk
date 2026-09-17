import { useState, useEffect } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, Calendar, CircleDollarSign, FileCheck2, FileText, LayoutDashboard, Menu, Plus, Search, Settings, ShieldCheck, Users, X, CheckCircle2, MoreHorizontal, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Payment, Receipt, Student, View } from '@/lib/types'
import { money } from '@/lib/formatters'
import { PaymentsTable } from '@/components/PaymentsTable'
import { Status } from '@/components/Status'

export function SimpleView({ view, students, payments, selectedCertificate, onCertificate, onInvoice }: { view: View; students: Student[]; payments: Payment[]; selectedCertificate?: Student | null; onCertificate: (s: Student) => void; onInvoice?: (p: Payment) => void }) {
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [invoiceQuery, setInvoiceQuery] = useState('')

  // Set startDate to beginning of current month
  useEffect(() => {
    setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  }, [])

  // Helper to parse date string like '15 Sep 2026'
  const parseDate = (dateString: string) => {
    const [day, month, year] = dateString.split(' ').map(s => s.trim())
    const monthMap = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    } as const;
    const monthNum = monthMap[month as keyof typeof monthMap];
    return new Date(parseInt(year), monthNum, parseInt(day))
  }
    
  if (view === 'Invoices') {
    // Group payments by invoice to get unique invoices
    const invoicesMap = new Map()
    payments.forEach(payment => {
      if (!invoicesMap.has(payment.invoice)) {
        invoicesMap.set(payment.invoice, {
          invoice: payment.invoice,
          studentName: payment.student,
          date: payment.date,
          amount: payment.amount,
          status: 'Paid',
          payment: payment,
        })
      }
    })
    const allInvoices = Array.from(invoicesMap.values())
    const invoices = allInvoices.filter(inv => {
      const matchText = inv.invoice.toLowerCase().includes(invoiceQuery.toLowerCase()) || 
                        inv.studentName.toLowerCase().includes(invoiceQuery.toLowerCase()) ||
                        inv.date.toLowerCase().includes(invoiceQuery.toLowerCase());
      const invDate = parseDate(inv.date)
      const matchDate = invDate >= startDate && invDate <= endDate;
      return matchText && matchDate;
    }).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())

    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">FINANCE</p>
            <h1>Invoices</h1>
            <p className="subcopy">GST invoices created automatically from payments.</p>
          </div>
          <div className="toolbar">
            <div className="date-filter-group">
              <span className="date-filter-label">From</span>
              <div className="date-input-wrap">
                <Calendar size={15} />
                <input
                  id="inv-start-date"
                  type="date"
                  value={startDate.toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                />
              </div>
              <span className="date-filter-label">To</span>
              <div className="date-input-wrap">
                <Calendar size={15} />
                <input
                  id="inv-end-date"
                  type="date"
                  value={endDate.toISOString().split('T')[0]}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                />
              </div>
            </div>
            <div className="filter-search filter-search-wide">
              <Search size={16} />
              <input 
                placeholder="Search by student, invoice or date…" 
                value={invoiceQuery}
                onChange={e => setInvoiceQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        <section className="panel">
          <div className="data-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Student</th>
                  <th>Date</th>
                  <th className="align-right">Amount</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr
                    key={inv.invoice}
                    className="clickable-row"
                    onClick={() => onInvoice && onInvoice(inv.payment)}
                  >
                    <td className="mono">{inv.invoice}</td>
                    <td><strong>{inv.studentName}</strong></td>
                    <td>{inv.date}</td>
                    <td className="align-right amount">{money(inv.amount)}</td>
                    <td className="align-right">
                      <div className="flex justify-end gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onInvoice) {
                              onInvoice(inv.payment);
                              setTimeout(() => window.print(), 600);
                            }
                          }}
                        >
                          <Printer size={14} className="mr-1" />
                          Save
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    )
  }
  if (view === 'Reports') {
    // Filter payments by date range (for revenue and method totals in the period)
    const filteredPayments = payments.filter(p => {
      const pDate = parseDate(p.date)
      return pDate >= startDate && pDate <= endDate
    })

    // Payments up to end date (for calculating outstanding as of endDate)
    const paymentsUpToEndDate = payments.filter(p => {
      const pDate = parseDate(p.date)
      return pDate <= endDate
    })

    // Calculate paid per student up to endDate
    const paidPerStudent = {} as Record<number, number>
    paymentsUpToEndDate.forEach(p => {
      paidPerStudent[p.studentId] = (paidPerStudent[p.studentId] || 0) + p.amount
    })

    const revenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
    const outstanding = students.reduce((sum, student) => {
      const paid = paidPerStudent[student.registerId] || 0
      return sum + (student.total - paid)
    }, 0)
    const methods = filteredPayments.reduce((summary, payment) => {
      summary[payment.method] = (summary[payment.method] ?? 0) + payment.amount
      return summary
    }, {} as Record<string, number>)

    const download = () => {
      const rows = [
        ['Student', 'Register ID', 'Course', 'Total Fees', 'Paid', 'Balance', 'Status', 'Lead Source', 'Lead Type'],
        ...students.map(student => [
          student.name,
           "TAI-" + student.registerId,
          student.course,
          String(student.total),
          String(student.paid),
          String(student.total - student.paid),
          student.status,
          student.leadSource || '-',
          student.leadType || '-',
        ]),
      ]
      const csv = rows
         .map(row => row.map(value => '"' + value.replaceAll('"', '""') + '"').join(","))
        .join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
       link.download = "thoorigai-report-" + new Date().toISOString().slice(0, 10) + ".csv"
      link.click()
      URL.revokeObjectURL(url)
    }

    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">OPERATIONS REPORTING</p>
            <h1>Reports</h1>
            <p className="subcopy">Live collection, balance, eligibility, and payment-method reporting.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <div className="date-filter-group">
              <span className="date-filter-label">From</span>
              <div className="date-input-wrap">
                <Calendar size={15} />
                <input
                  id="rep-start-date"
                  type="date"
                  value={startDate.toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                />
              </div>
              <span className="date-filter-label">To</span>
              <div className="date-input-wrap">
                <Calendar size={15} />
                <input
                  id="rep-end-date"
                  type="date"
                  value={endDate.toISOString().split('T')[0]}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                />
              </div>
            </div>
            <Button variant="default" size="default" onClick={download} className="shrink-0">
              <FileText size={16} />
              <span className="ml-2">Download CSV</span>
            </Button>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-head"><span>Revenue collected</span><CircleDollarSign size={17} /></div>
            <div className="stat-value">{money(revenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-head"><span>Outstanding balance</span><ArrowDownRight size={17} /></div>
            <div className="stat-value">{money(outstanding)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-head"><span>Students</span><Users size={17} /></div>
            <div className="stat-value">{students.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-head"><span>Certificate eligible</span><ShieldCheck size={17} /></div>
            <div className="stat-value">{students.filter(student => student.status === 'Fully Paid').length}</div>
          </div>
        </div>
        <div className="report-grid">
          <section className="panel report-main">
            <div className="panel-header">
              <div>
                <h2>Payment method totals</h2>
                <p>Collected amount grouped by payment method (selected period)</p>
              </div>
            </div>
            <div className="distribution">
              {Object.entries(methods).map(([method, total]) => (
                <div className="dist-row" key={method}>
                  <div>
                    <span>{method}</span>
                    <strong>{money(total)}</strong>
                  </div>
                  <div className="bar">
                     <i style={{ width: revenue ? Math.min(100, (total / revenue) * 100) : 0 + "%" }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="panel report-side">
            <div className="panel-header">
              <div>
                <h2>Recent transactions</h2>
                <p>{filteredPayments.length} payment records in selected period</p>
              </div>
            </div>
            <PaymentsTable payments={filteredPayments.slice(0, 5)} onInvoice={onInvoice} compact />
          </section>
        </div>
      </>
    )
  }
  if (view === 'Certificates') {
    const eligible = students.filter(s => s.status === 'Fully Paid')
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">COMPLETION RECORDS</p>
            <h1>Certificates</h1>
            <p className="subcopy">Generate certificates for students with cleared balances.</p>
          </div>
        </div>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Eligible students</h2>
              <p>{eligible.length} students ready for certificate generation</p>
            </div>
          </div>
          <div className="data-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Register ID</th>
                  <th>Course</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {eligible.map(s => (
                  <tr key={s.registerId}>
                    <td><strong>{s.name}</strong></td>
                    <td className="mono">TAI-{s.registerId}</td>
                    <td>{s.course}</td>
                    <td>
                      <Button
                        variant="default"
                        size="default"
                        className="btn-compact"
                        onClick={() => onCertificate(s)}
                      >
                        {selectedCertificate?.registerId === s.registerId ? 'Selected' : 'Generate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    )
  }
  return <div className="empty-state"><BarChart3 size={24} /><h2>Reports</h2><p>Reports will reflect live payment activity as it is recorded.</p></div>
}