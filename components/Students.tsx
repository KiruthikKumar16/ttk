import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, ChevronDown, CircleDollarSign, FileCheck2, FileText, LayoutDashboard, Menu, Plus, Search, Settings, ShieldCheck, Users, X, CheckCircle2, MoreHorizontal, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Payment, Receipt, Student, View } from '@/lib/types'
import { money } from '@/lib/formatters'
import { Status } from '@/components/Status'

export function Students({ students, onAdd, onSelect }: { students: Student[]; onAdd: () => void; onSelect: (s: Student) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All status');
  const [sourceFilter, setSourceFilter] = useState('All sources');
  const filtered = useMemo(() =>
    students.filter(s =>
      (s.name.toLowerCase().includes(query.toLowerCase()) || String(s.registerId).includes(query)) &&
      (filter === 'All status' || s.status === filter) &&
      (sourceFilter === 'All sources' || s.studentSource === sourceFilter)
    ),
    [students, query, filter, sourceFilter]
  );
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
        <div className="toolbar">
          <div className="filter-search">
            <Search size={16} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or register ID" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option>All status</option>
            <option>Fully Paid</option>
            <option>Pending</option>
          </select>
          {/* Student Source Filter */}
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="ml-2">
            <option>All sources</option>
            {Array.from(new Set(students.map(s => s.studentSource).filter(Boolean))).map(src => (
              <option key={src}>{src}</option>
            ))}
          </select>
        </div>
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
        <div className="table-summary">Showing <strong>{filtered.length}</strong> students</div>
      </section>
    </>
  );
}