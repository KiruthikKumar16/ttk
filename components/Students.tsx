import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, ChevronDown, CircleDollarSign, FileCheck2, FileText, LayoutDashboard, Menu, Plus, Search, Settings, ShieldCheck, Users, X, CheckCircle2, MoreHorizontal, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Payment, Receipt, Student, View } from '@/lib/types'
import { money } from '@/lib/formatters'
import { Status } from '@/components/Status'

export function Students({
  students,
  onAdd,
  onSelect,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: {
  students: Student[];
  onAdd: () => void;
  onSelect: (s: Student) => void;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
}) {
  // No client-side filtering/search; we rely on server-side pagination
  const filtered = students // we could keep a filter but removed for simplicity

  const totalPages = Math.ceil(totalCount / pageSize)
  const fromIndex = (page - 1) * pageSize + 1
  const toIndex = Math.min(page * pageSize, totalCount)

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ACADEMY RECORDS</p>
          <h1>Students</h1>
          <p className="subcopy">Manage enrollment, fees, and student records.</p>
        </div>
        <Button variant="default" size="default" onClick={onAdd}>
          <Plus size={16} />
          <span className="ml-2">Add student</span>
        </Button>
      </div>
      <section className="panel">
        <div className="data-wrap">
          <table>
            <thead>
              <tr>
                <th>Register ID</th>
                <th>Student</th>
                <th>Course</th>
                <th>Batch start</th>
                <th className="align-right">Total fees</th>
                <th className="align-right">Balance</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.registerId} className="clickable-row" onClick={() => onSelect(s)}>
                  <td className="mono">TAI-{s.registerId}</td>
                  <td>
                    <div className="student-cell">
                      <div className="mini-avatar">{s.name.split(' ').map(x => x[0]).join('')}</div>
                      <div>
                        <strong>{s.name}</strong>
                        <small>{s.phone}</small>
                      </div>
                    </div>
                  </td>
                  <td>{s.course}</td>
                  <td>{s.batch}</td>
                  <td className="align-right">{money(s.total)}</td>
                  <td className="align-right amount">{money(s.total - s.paid)}</td>
                  <td>{s.studentSource || '-'}</td>
                  <td><Status status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-summary">
          Showing <strong>{fromIndex}-{toIndex}</strong> of <strong>{totalCount}</strong> students
        </div>
        {/* Pagination controls */}
        <div className="pagination">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (page > 1) onPageChange(page - 1)
            }}
            disabled={page === 1}
          >
            <ChevronDown size={16} />
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (page < totalPages) onPageChange(page + 1)
            }}
            disabled={page === totalPages}
          >
            <ChevronUp size={16} />
          </Button>
        </div>
      </section>
    </>
  )
}