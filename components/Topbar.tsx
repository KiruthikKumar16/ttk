'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  ChevronRight,
  FileCheck2,
  FileText,
  Menu,
  Receipt,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import type { Payment, Student, View } from '@/lib/types'
import { money } from '@/lib/formatters'
import { differenceRupees } from '@/lib/money'

type BreadcrumbSegment = {
  label: string
  onClick?: () => void
  icon?: React.ReactNode
  bold?: boolean
}

type TopbarProps = {
  view: View
  onMenu: () => void
  students: Student[]
  payments: Payment[]
  onViewStudent: (student: Student) => void
  onCertificate: (student: Student) => void
  onInvoice: (payment: Payment) => void
  selectedStudent?: Student | null
  selectedInvoice?: Payment | null
  selectedCertificate?: Student | null
  setView: (view: View) => void
  onRoot: () => void
  onClearDetail: () => void
}

export function Topbar({
  view,
  onMenu,
  students,
  payments,
  onViewStudent,
  onCertificate,
  onInvoice,
  selectedStudent,
  selectedInvoice,
  selectedCertificate,
  setView,
  onRoot,
  onClearDetail,
}: TopbarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return students
      .filter(s => {
        const id = `tai-${s.registerId}`
        return (
          s.name.toLowerCase().includes(q) ||
          id.includes(q) ||
          String(s.registerId).includes(q) ||
          s.course.toLowerCase().includes(q) ||
          s.phone.includes(q)
        )
      })
      .slice(0, 8)
  }, [query, students])

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const invoicesFor = (student: Student) =>
    payments.filter(p => p.studentId === student.registerId)

  const choose = (fn: () => void) => {
    fn()
    setOpen(false)
    setQuery('')
  }

  const segments = useMemo<BreadcrumbSegment[]>(() => {
    const base: BreadcrumbSegment[] = [
      { label: 'Workspace', onClick: onRoot },
    ]

    if (selectedCertificate) {
      return [
        ...base,
        { label: 'Certificates', onClick: () => setView('Certificates') },
        {
          label: selectedCertificate.name,
          icon: <Users size={12} />,
          onClick: () => onViewStudent(selectedCertificate),
        },
        {
          label: 'Certificate',
          icon: <FileCheck2 size={12} />,
          bold: true,
        },
      ]
    }

    if (selectedInvoice) {
      const invStudent = students.find(s => s.registerId === selectedInvoice.studentId)
      return [
        ...base,
        { label: 'Invoices', onClick: () => setView('Invoices') },
        ...(invStudent
          ? [
              {
                label: invStudent.name,
                icon: <UserRound size={12} />,
                onClick: () => onViewStudent(invStudent),
              } as BreadcrumbSegment,
            ]
          : []),
        {
          label: `Receipt ${selectedInvoice.invoice}`,
          icon: <Receipt size={12} />,
          bold: true,
        },
      ]
    }

    if (selectedStudent) {
      return [
        ...base,
        { label: 'Students', onClick: () => setView('Students') },
        {
          label: selectedStudent.name,
          icon: <UserRound size={12} />,
          bold: true,
          onClick: onClearDetail,
        },
      ]
    }

    return [
      ...base,
      {
        label: view,
        bold: true,
      },
    ]
  }, [
    view,
    selectedStudent,
    selectedInvoice,
    selectedCertificate,
    students,
    onRoot,
    onClearDetail,
    onViewStudent,
    setView,
  ])

  return (
    <header className="topbar">
      <Button variant="default" size="default" onClick={onMenu} className="p-0" aria-label="Open navigation">
        <Menu size={20} />
      </Button>
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <ol className="breadcrumb">
          {segments.map((seg, i) => (
            <li key={i} className="breadcrumb-item">
              {i > 0 && (
                <span className="breadcrumb-sep" aria-hidden="true">
                  <ChevronRight size={12} />
                </span>
              )}
              {seg.onClick ? (
                <button
                  type="button"
                  onClick={seg.onClick}
                  className={
                    'breadcrumb-link' +
                    (seg.bold ? ' breadcrumb-current' : '')
                  }
                >
                  {seg.icon && <span className="breadcrumb-icon">{seg.icon}</span>}
                  <span>{seg.label}</span>
                </button>
              ) : (
                <span
                  className={
                    'breadcrumb-static' +
                    (seg.bold ? ' breadcrumb-current' : '')
                  }
                >
                  {seg.icon && <span className="breadcrumb-icon">{seg.icon}</span>}
                  <span>{seg.label}</span>
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="top-actions">
        <div className="top-search-wrap" ref={wrapRef}>
          <div className={'top-search' + (open ? ' is-open' : '')}>
            <Search size={16} />
            <input
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search student name…"
              aria-label="Search students"
              aria-expanded={open}
              aria-controls="student-search-results"
            />
            {query && (
              <button
                type="button"
                className="top-search-clear"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('')
                  setOpen(false)
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {open && query.trim() && (
            <div className="student-search-panel" id="student-search-results" role="listbox">
              {matches.length === 0 ? (
                <div className="student-search-empty">No student matches “{query.trim()}”.</div>
              ) : (
                matches.map(student => {
                  const invoices = invoicesFor(student)
                  const eligible = student.status === 'Fully Paid'
                  const outstanding = differenceRupees(student.total, student.paid)
                  return (
                    <article key={student.registerId} className="student-search-card">
                      <header className="student-search-head">
                        <div>
                          <strong>{student.name}</strong>
                          <p>
                            TAI-{student.registerId} · {student.course}
                          </p>
                        </div>
                        <span className={'student-search-chip' + (eligible ? ' is-ready' : '')}>
                          {eligible ? 'Certificate eligible' : 'Certificate pending'}
                        </span>
                      </header>
                      <div className="student-search-actions">
                        <button type="button" onClick={() => choose(() => onViewStudent(student))}>
                          <UserRound size={14} />
                          View student
                        </button>
                        <button
                          type="button"
                          disabled={!eligible}
                          title={
                            eligible
                              ? 'Generate certificate'
                              : `Balance remaining: ${money(outstanding)}`
                          }
                          onClick={() => eligible && choose(() => onCertificate(student))}
                        >
                          <FileCheck2 size={14} />
                          {eligible
                            ? 'Generate certificate'
                            : `Not eligible · ${money(outstanding)} due`}
                        </button>
                      </div>
                      <div className="student-search-invoices">
                        <span>
                          <FileText size={13} />
                          Invoices
                        </span>
                        {invoices.length === 0 ? (
                          <p>No invoices yet</p>
                        ) : (
                          <ul>
                            {invoices.map(payment => (
                              <li key={payment.id}>
                                <button type="button" onClick={() => choose(() => onInvoice(payment))}>
                                  <span>{payment.invoice}</span>
                                  <em>
                                    {payment.date} · {money(payment.amount)}
                                  </em>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          )}
        </div>
        <div className="top-avatar">AK</div>
      </div>
    </header>
  )
}
