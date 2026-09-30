'use client'

import { useState, useMemo } from 'react'
import {
  ArrowDownRight,
  BarChart3,
  Calendar,
  CircleDollarSign,
  FileText,
  ShieldCheck,
  Users,
  CheckCircle2,
  TrendingUp,
  PieChart,
  Wallet,
  Clock,
  GraduationCap,
  Globe,
  Share2,
  Building,
  Footprints,
  Compass,
  Activity,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Payment, Student, Course, CourseCategory } from '@/lib/types'
import { money } from '@/lib/formatters'
import { PaymentsTable } from '@/components/shared/PaymentsTable'

// Robust date parser supporting '15 Sep 2026', '2026-09-18', '14-Sep-2026', etc.
function parseDate(dateString?: string): Date {
  if (!dateString) return new Date(0)
  const direct = new Date(dateString)
  if (!isNaN(direct.getTime()) && !dateString.includes(' ') && !dateString.includes('-')) {
    return direct
  }
  if (dateString.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return direct
  }
  const clean = dateString.replace(/[-/]/g, ' ').trim()
  const parts = clean.split(/\s+/)
  if (parts.length === 3) {
    const monthMap: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    }
    const mIdx = monthMap[parts[1].toLowerCase().slice(0, 3)]
    if (mIdx !== undefined) {
      return new Date(parseInt(parts[2], 10), mIdx, parseInt(parts[0], 10))
    }
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    }
  }
  return isNaN(direct.getTime()) ? new Date(0) : direct
}

export function ReportsView({
  students = [],
  payments = [],
  categories = [],
  courses = [],
}: {
  students: Student[]
  payments: Payment[]
  categories?: CourseCategory[]
  courses?: Course[]
}) {
  const [startDateStr, setStartDateStr] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-01-01`
  })
  const [endDateStr, setEndDateStr] = useState(() => {
    return new Date().toISOString().slice(0, 10)
  })

  const startDate = useMemo(() => new Date(`${startDateStr}T00:00:00`), [startDateStr])
  const endDate = useMemo(() => new Date(`${endDateStr}T23:59:59.999`), [endDateStr])

  // Filter payments by date range (for revenue and method totals in the period)
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const pDate = parseDate(p.paymentDate || p.date)
      return pDate >= startDate && pDate <= endDate
    })
  }, [payments, startDate, endDate])

  // Payments up to end date (for calculating outstanding as of endDate)
  const paymentsUpToEndDate = useMemo(() => {
    return payments.filter((p) => {
      const pDate = parseDate(p.paymentDate || p.date)
      return pDate <= endDate
    })
  }, [payments, endDate])

  // Calculate paid per student up to endDate
  const paidPerStudent = useMemo(() => {
    const map: Record<number, number> = {}
    paymentsUpToEndDate.forEach((p) => {
      map[p.studentId] = (map[p.studentId] || 0) + p.amount
    })
    return map
  }, [paymentsUpToEndDate])

  const categoryStats = useMemo(() => {
    const courseCatMap = new Map<string, { id: string; name: string }>()
    courses.forEach((c) => {
      if (c.categoryId && c.categoryName) {
        courseCatMap.set(c.name.trim().toLowerCase(), { id: c.categoryId, name: c.categoryName })
      }
    })

    return categories.map((cat) => {
      const catStudents = students.filter((s) => {
        const cInfo = courseCatMap.get(s.course.trim().toLowerCase())
        return cInfo?.id === cat.id
      })
      const catFees = catStudents.reduce((sum, s) => sum + s.total, 0)
      const catPaid = catStudents.reduce((sum, s) => sum + (paidPerStudent[s.registerId] ?? s.paid ?? 0), 0)
      const catOutstanding = catFees - catPaid
      const catRate = catFees > 0 ? Math.round((catPaid / catFees) * 100) : 0
      const shareOfTotal = students.length > 0 ? Math.round((catStudents.length / students.length) * 100) : 0

      return {
        ...cat,
        studentCount: catStudents.length,
        totalFees: catFees,
        collected: catPaid,
        outstanding: Math.max(0, catOutstanding),
        collectionRate: catRate,
        enrollmentShare: shareOfTotal,
      }
    })
  }, [categories, courses, students, paidPerStudent])

  const revenue = useMemo(() => filteredPayments.reduce((sum, p) => sum + p.amount, 0), [filteredPayments])
  const totalFees = useMemo(() => students.reduce((s, x) => s + x.total, 0), [students])
  const totalPaid = useMemo(
    () => students.reduce((s, x) => s + (paidPerStudent[x.registerId] ?? x.paid ?? 0), 0),
    [students, paidPerStudent],
  )
  const outstanding = useMemo(
    () =>
      students.reduce((sum, student) => {
        const paid = paidPerStudent[student.registerId] ?? student.paid ?? 0
        return sum + Math.max(0, student.total - paid)
      }, 0),
    [students, paidPerStudent],
  )

  const methods = useMemo(() => {
    return filteredPayments.reduce(
      (summary, payment) => {
        summary[payment.method] = (summary[payment.method] ?? 0) + payment.amount
        return summary
      },
      {} as Record<string, number>,
    )
  }, [filteredPayments])

  const methodCounts = useMemo(() => {
    return filteredPayments.reduce(
      (summary, payment) => {
        summary[payment.method] = (summary[payment.method] ?? 0) + 1
        return summary
      },
      {} as Record<string, number>,
    )
  }, [filteredPayments])

  const studentSourceCounts = useMemo(() => {
    return students.reduce(
      (acc, s) => {
        const src = s.studentSource || (s as { leadSource?: string }).leadSource || 'Direct Walk-in'
        acc[src] = (acc[src] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }, [students])

  const courseCounts = useMemo(() => {
    return students.reduce(
      (acc, s) => {
        acc[s.course] = (acc[s.course] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }, [students])

  const fullyPaid = useMemo(() => students.filter((s) => s.status === 'Fully Paid').length, [students])
  const pending = useMemo(() => students.filter((s) => s.status === 'Pending').length, [students])

  const avgFee = students.length > 0 ? Math.round(totalFees / students.length) : 0
  const collectionRate = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0

  const timelineMap = useMemo(() => {
    return filteredPayments.reduce(
      (acc, p) => {
        acc[p.date] = (acc[p.date] ?? 0) + p.amount
        return acc
      },
      {} as Record<string, number>,
    )
  }, [filteredPayments])

  const timelineEntries = useMemo(() => {
    return Object.entries(timelineMap).sort((a, b) => {
      return parseDate(a[0]).getTime() - parseDate(b[0]).getTime()
    })
  }, [timelineMap])

  const download = () => {
    const rows = [
      ['Student', 'Register ID', 'Course', 'Total Fees', 'Paid', 'Balance', 'Status', 'Source'],
      ...students.map((student) => [
        student.name,
        'TAI-' + student.registerId,
        student.course,
        String(student.total),
        String(student.paid),
        String(student.total - student.paid),
        student.status,
        student.studentSource || (student as { leadSource?: string }).leadSource || '-',
      ]),
    ]
    const csv = rows.map((row) => row.map((value) => '"' + value.replaceAll('"', '""') + '"').join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'thoorigai-report-' + new Date().toISOString().slice(0, 10) + '.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const methodColors: Record<string, string> = {
    UPI: '#6366f1',
    'Bank Transfer': '#0ea5e9',
    Cash: '#10b981',
    Card: '#f59e0b',
    Cheque: '#ec4899',
  }

  const donutCircumference = 2 * Math.PI * 46 // radius 46 -> ~289
  const methodSlices = useMemo(() => {
    let runPct = 0
    return Object.entries(methods).map(([method, amount]) => {
      const pct = revenue > 0 ? (amount / revenue) * 100 : 0
      const offset = -((runPct / 100) * donutCircumference)
      runPct += pct
      const strokeDasharray = `${(pct / 100) * donutCircumference} ${donutCircumference}`
      return {
        method,
        amount,
        pct,
        offset,
        strokeDasharray,
        color: methodColors[method] || '#8b5cf6',
      }
    })
  }, [methods, revenue, donutCircumference])

  const sourceIcons: Record<string, typeof Globe> = {
    Website: Globe,
    'Social Media': Share2,
    'Campus Drive': Building,
    'Walk-in': Footprints,
    'Direct Walk-in': Footprints,
    Reference: Users,
    Alumni: Users,
  }

  const maxCourseCount = Math.max(...Object.values(courseCounts), 1)

  const femaleStudents = useMemo(() => students.filter((s) => s.gender === 'Female'), [students])
  const maleStudents = useMemo(() => students.filter((s) => s.gender === 'Male'), [students])
  const otherStudents = useMemo(() => students.filter((s) => s.gender !== 'Female' && s.gender !== 'Male'), [students])

  const femalePct = students.length ? Math.round((femaleStudents.length / students.length) * 100) : 0
  const malePct = students.length ? Math.round((maleStudents.length / students.length) * 100) : 0
  const otherPct = students.length ? Math.round((otherStudents.length / students.length) * 100) : 0

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OPERATIONS REPORTING</p>
          <h1>Reports</h1>
          <p className="subcopy">
            Executive analytics — financial velocity, cohort enrollment, marketing channels, and collection insights.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <div className="date-filter-group">
            <span className="date-filter-label">From</span>
            <div className="date-input-wrap">
              <Calendar size={15} />
              <input
                id="rep-start-date"
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
              />
            </div>
            <span className="date-filter-label">To</span>
            <div className="date-input-wrap">
              <Calendar size={15} />
              <input id="rep-end-date" type="date" value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} />
            </div>
          </div>
          <Button variant="default" size="default" onClick={download} className="shrink-0">
            <FileText size={16} />
            <span className="ml-2">Download CSV</span>
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4x2 BALANCED KPI METRICS GRID (8 Comprehensive Metrics)
          ═══════════════════════════════════════════════════════ */}
      <div className="reports-stats-grid">
        {/* Row 1: Financial Performance */}
        <div className="stat-card">
          <div className="stat-head">
            <span>Revenue collected</span>
            <div className="stat-icon icon-green">
              <CircleDollarSign size={16} />
            </div>
          </div>
          <div className="stat-value">{money(revenue)}</div>
          <p className="stat-sub">In selected period</p>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <span>Total course fees</span>
            <div className="stat-icon icon-navy">
              <Wallet size={16} />
            </div>
          </div>
          <div className="stat-value">{money(totalFees)}</div>
          <p className="stat-sub">Enrolled cohort value</p>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <span>Outstanding balance</span>
            <div className="stat-icon icon-amber">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="stat-value">{money(outstanding)}</div>
          <p className="stat-sub">Pending collection</p>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <span>Collection efficiency</span>
            <div className="stat-icon icon-blue">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="stat-value">{collectionRate}%</div>
          <p className="stat-sub">
            {money(totalPaid)} of {money(totalFees)}
          </p>
        </div>

        {/* Row 2: Operational Health & Demographics */}
        <div className="stat-card">
          <div className="stat-head">
            <span>Total students</span>
            <div className="stat-icon icon-blue">
              <Users size={16} />
            </div>
          </div>
          <div className="stat-value">{students.length}</div>
          <p className="stat-sub">Active enrollments</p>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <span>Certificate eligible</span>
            <div className="stat-icon icon-green">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="stat-value">{fullyPaid}</div>
          <p className="stat-sub">100% fees cleared</p>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <span>Pending dues</span>
            <div className="stat-icon icon-amber">
              <Clock size={16} />
            </div>
          </div>
          <div className="stat-value">{pending}</div>
          <p className="stat-sub">Students with balance</p>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <span>Average course fee</span>
            <div className="stat-icon icon-navy">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="stat-value">{money(avgFee)}</div>
          <p className="stat-sub">Per enrolled student</p>
        </div>
      </div>

      {/* Curriculum Category Performance Tiers */}
      {categoryStats.length > 0 && (
        <section className="panel mb-6 p-5">
          <div className="panel-header border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Curriculum Tier Performance</h2>
              <p className="text-xs text-gray-500">
                Enrollment volume, total tuition value, and fee realization by duration tier
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              {categoryStats.length} Categories Configured
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoryStats.map((cat) => {
              const isInternship = cat.name.toLowerCase().includes('internship')
              const isElite = cat.name.toLowerCase().includes('elite')
              const isEssential = cat.name.toLowerCase().includes('essential')
              const dotColor = isInternship
                ? 'bg-emerald-500'
                : isElite
                  ? 'bg-purple-500'
                  : isEssential
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
              const barColor = isInternship
                ? 'bg-emerald-600'
                : isElite
                  ? 'bg-purple-600'
                  : isEssential
                    ? 'bg-amber-500'
                    : 'bg-blue-600'

              return (
                <div
                  key={cat.id}
                  className="border border-gray-200/90 rounded-xl p-4 bg-gradient-to-br from-white to-slate-50/50 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <h3 className="font-bold text-gray-900 text-base">{cat.name}</h3>
                      </div>
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {cat.duration}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <span className="text-[11px] text-gray-400 uppercase font-medium">Students</span>
                        <div className="text-lg font-bold text-gray-900 mt-0.5">{cat.studentCount}</div>
                        <span className="text-[10px] text-gray-500">{cat.enrollmentShare}% of cohort</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 uppercase font-medium">Realization</span>
                        <div className="text-lg font-bold text-emerald-600 mt-0.5">{cat.collectionRate}%</div>
                        <span className="text-[10px] text-gray-500">Collected vs Total</span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Total Tuition:</span>
                        <strong className="text-gray-900">{money(cat.totalFees)}</strong>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Collected:</span>
                        <strong className="text-emerald-700">{money(cat.collected)}</strong>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Pending Balance:</span>
                        <strong className="text-amber-700">{money(cat.outstanding)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, cat.collectionRate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          DISTINCT GRAPH VISUALIZATIONS (6 Diverse Graph Types)
          ═══════════════════════════════════════════════════════ */}
      <div className="report-grid">
        {/* ── GRAPH 1: Payment Method Breakdown (SVG Donut Chart) ── */}
        <section className="panel report-main">
          <div className="panel-header chart-panel-header">
            <div>
              <h2>Payment method totals</h2>
              <p>Revenue distribution by payment channel (selected period)</p>
            </div>
            <span className="chart-badge chart-badge-blue">
              <PieChart size={12} />
              Donut Breakdown
            </span>
          </div>

          {Object.keys(methods).length === 0 ? (
            <p className="empty-note">No payments recorded in selected period.</p>
          ) : (
            <div className="donut-chart-container">
              <div className="donut-svg-box">
                <svg viewBox="0 0 120 120">
                  {/* Background track */}
                  <circle cx="60" cy="60" r="46" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                  {/* Data segments */}
                  {methodSlices.map((slice) => (
                    <circle
                      key={slice.method}
                      cx="60"
                      cy="60"
                      r="46"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="14"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.offset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out hover:opacity-85 cursor-pointer"
                    />
                  ))}
                </svg>
                <div className="donut-center-info">
                  <span className="donut-center-value">{money(revenue)}</span>
                  <span className="donut-center-label">Collected</span>
                </div>
              </div>

              <div className="donut-details-list">
                {Object.entries(methods).map(([method, amount]) => {
                  const pct = revenue > 0 ? Math.round((amount / revenue) * 100) : 0
                  const count = methodCounts[method] || 1
                  const color = methodColors[method] || '#8b5cf6'

                  return (
                    <div className="donut-detail-item" key={method}>
                      <div className="flex items-center gap-2">
                        <span className="donut-color-dot" style={{ background: color }} />
                        <strong className="text-slate-800">{method}</strong>
                        <span className="text-[10px] text-slate-400">({count} tx)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{money(amount)}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── GRAPH 2: Enrollment by Course (Vertical Column Bar Chart) ── */}
        <section className="panel report-side">
          <div className="panel-header chart-panel-header">
            <div>
              <h2>Enrollment by course</h2>
              <p>Student density across active training programs</p>
            </div>
            <span className="chart-badge chart-badge-purple">
              <BarChart3 size={12} />
              {Object.keys(courseCounts).length} Courses
            </span>
          </div>

          <div className="col-chart-container">
            {/* Dashed guidelines */}
            <div className="col-chart-guidelines">
              <div className="col-chart-line">
                <span>{maxCourseCount} std</span>
              </div>
              <div className="col-chart-line">
                <span>{Math.ceil(maxCourseCount / 2)} std</span>
              </div>
              <div className="col-chart-line">
                <span>0</span>
              </div>
            </div>

            {/* Vertical column bars */}
            <div className="col-chart-bars-wrap">
              {Object.entries(courseCounts).map(([course, count]) => {
                const heightPercent = Math.max(18, Math.round((count / maxCourseCount) * 82))
                const sharePct = students.length ? Math.round((count / students.length) * 100) : 0

                return (
                  <div className="col-pillar-col" key={course} title={`${course}: ${count} students (${sharePct}%)`}>
                    <span className="col-pillar-count">{count}</span>
                    <div className="col-pillar-bar" style={{ height: `${heightPercent}%` }} />
                    <span className="col-pillar-label">{course.replace(' Course', '').replace('ThoorigAI ', '')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── GRAPH 3: Acquisition Channels (Marketing Flow Cards) ── */}
        <section className="panel report-main">
          <div className="panel-header chart-panel-header">
            <div>
              <h2>Acquisition channels</h2>
              <p>How registered students discovered the institute</p>
            </div>
            <span className="chart-badge chart-badge-green">
              <Globe size={12} />
              Marketing Flow
            </span>
          </div>

          <div className="channel-cards-list">
            {Object.entries(studentSourceCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([src, count], idx) => {
                const pct = students.length ? Math.round((count / students.length) * 100) : 0
                const IconComponent = sourceIcons[src] || Compass
                const gradients = [
                  'linear-gradient(90deg, #6366f1, #818cf8)',
                  'linear-gradient(90deg, #0ea5e9, #38bdf8)',
                  'linear-gradient(90deg, #10b981, #34d399)',
                  'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  'linear-gradient(90deg, #ec4899, #f472b6)',
                ]
                const barGradient = gradients[idx % gradients.length]

                return (
                  <div className="channel-card-item" key={src}>
                    <div className="channel-card-meta">
                      <div className="channel-icon-tag">
                        <div className="channel-icon-pill bg-slate-100 text-slate-700">
                          <IconComponent size={14} />
                        </div>
                        <span>{src}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-700">{count} students</span>
                        <span className="channel-count-pill bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="channel-track">
                      <div className="channel-fill" style={{ width: `${pct}%`, background: barGradient }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </section>

        {/* ── GRAPH 4: Payment Cash Flow Velocity (Vertical SVG Area Chart) ── */}
        <section className="panel report-side">
          <div className="panel-header chart-panel-header">
            <div>
              <h2>Payment cash flow velocity</h2>
              <p>Transaction inflow pattern across selected period</p>
            </div>
            <span className="chart-badge chart-badge-green">
              <Activity size={12} />
              {filteredPayments.length} Transactions
            </span>
          </div>

          {timelineEntries.length === 0 ? (
            <p className="empty-note">No payment velocity data in this period.</p>
          ) : (
            <div className="timeline-chart-wrap">
              {(() => {
                const maxTimelineAmount = Math.max(...timelineEntries.map((e) => e[1]), 1000)
                const count = timelineEntries.length
                const width = 520
                const height = 180
                const paddingX = 35
                const paddingTop = 32
                const paddingBottom = 26
                const graphHeight = height - paddingTop - paddingBottom

                // Generate coordinates with safe headroom
                const points = timelineEntries.map((entry, idx) => {
                  const x = count === 1 ? width / 2 : paddingX + (idx / (count - 1)) * (width - 2 * paddingX)
                  const y = height - paddingBottom - (entry[1] / maxTimelineAmount) * graphHeight
                  return { x, y, date: entry[0], amount: entry[1] }
                })

                const baselineY = height - paddingBottom

                const linePath =
                  points.length === 1
                    ? `M ${points[0].x - 50} ${points[0].y} L ${points[0].x + 50} ${points[0].y}`
                    : points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')

                const areaPath =
                  points.length === 1
                    ? `M ${points[0].x - 50} ${baselineY} L ${points[0].x - 50} ${points[0].y} L ${points[0].x + 50} ${points[0].y} L ${points[0].x + 50} ${baselineY} Z`
                    : `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`

                return (
                  <>
                    <div className="timeline-svg-container">
                      <svg viewBox={`0 0 ${width} ${height}`}>
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        {/* Guidelines */}
                        <line
                          x1={paddingX}
                          y1={paddingTop}
                          x2={width - paddingX}
                          y2={paddingTop}
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text x={width - paddingX} y={paddingTop - 4} fontSize="8.5" fill="#94a3b8" textAnchor="end">
                          {money(maxTimelineAmount)}
                        </text>

                        <line
                          x1={paddingX}
                          y1={paddingTop + graphHeight / 2}
                          x2={width - paddingX}
                          y2={paddingTop + graphHeight / 2}
                          stroke="#f1f5f9"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />

                        {/* Baseline */}
                        <line
                          x1={paddingX}
                          y1={baselineY}
                          x2={width - paddingX}
                          y2={baselineY}
                          stroke="#cbd5e1"
                          strokeWidth="1"
                        />

                        {/* Area fill */}
                        <path d={areaPath} fill="url(#areaGradient)" />

                        {/* Line stroke */}
                        <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Dots & Labels */}
                        {points.map((pt, i) => (
                          <g key={i} className="cursor-pointer">
                            <circle cx={pt.x} cy={pt.y} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2.5" />
                            <text
                              x={pt.x}
                              y={pt.y - 10}
                              fontSize="9"
                              fontWeight="700"
                              fill="#3730a3"
                              textAnchor="middle"
                            >
                              {money(pt.amount)}
                            </text>
                            <text x={pt.x} y={height - 8} fontSize="8.5" fill="#64748b" textAnchor="middle">
                              {pt.date.split(' ').slice(0, 2).join(' ')}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    <div className="timeline-meta-bar">
                      <span>
                        Period Inflow: <strong>{money(revenue)}</strong>
                      </span>
                      <span>
                        Avg Transaction:{' '}
                        <strong>
                          {money(filteredPayments.length ? Math.round(revenue / filteredPayments.length) : 0)}
                        </strong>
                      </span>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </section>

        {/* ── GRAPH 5: Payment Clearance Status (Gauge + Cards) ── */}
        <section className="panel report-main">
          <div className="panel-header chart-panel-header">
            <div>
              <h2>Payment clearance status</h2>
              <p>Clearance ratio & active balances</p>
            </div>
            <span className="chart-badge chart-badge-amber">
              <ShieldCheck size={12} />
              Health
            </span>
          </div>

          <div className="status-gauge-wrap">
            <div className="status-radial-circle">
              <svg viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="35" fill="transparent" stroke="#f1f5f9" strokeWidth="9" />
                {/* Paid portion */}
                <circle
                  cx="45"
                  cy="45"
                  r="35"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="9"
                  strokeDasharray={`${(collectionRate / 100) * (2 * Math.PI * 35)} ${2 * Math.PI * 35}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="donut-center-info">
                <span className="text-sm font-bold text-emerald-600">{collectionRate}%</span>
                <span className="text-[8px] uppercase tracking-wider text-slate-400">Settled</span>
              </div>
            </div>

            <div className="status-cards-stack">
              <div className="status-metric-card status-card-paid">
                <div>
                  <div className="status-card-title flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    Fully Cleared
                  </div>
                  <div className="text-[10px] text-slate-500">Ready for certificate</div>
                </div>
                <div className="text-right">
                  <div className="status-card-num">{fullyPaid}</div>
                  <span className="text-[9px] text-emerald-700 font-semibold">
                    {students.length ? Math.round((fullyPaid / students.length) * 100) : 0}% cohort
                  </span>
                </div>
              </div>

              <div className="status-metric-card status-card-pending">
                <div>
                  <div className="status-card-title flex items-center gap-1.5">
                    <Clock size={12} />
                    Pending Dues
                  </div>
                  <div className="text-[10px] text-slate-500">{money(outstanding)} due</div>
                </div>
                <div className="text-right">
                  <div className="status-card-num">{pending}</div>
                  <span className="text-[9px] text-amber-700 font-semibold">
                    {students.length ? Math.round((pending / students.length) * 100) : 0}% cohort
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── GRAPH 6: Gender Demographics ── */}
        <section className="panel report-side">
          <div className="panel-header chart-panel-header">
            <div>
              <h2>Gender demographics</h2>
              <p>Cohort gender distribution & representation</p>
            </div>
            <span className="chart-badge chart-badge-blue">
              <Users size={12} />
              Ratio {femaleStudents.length}:{maleStudents.length}
            </span>
          </div>

          <div className="demographics-wrap">
            {/* Segmented ratio bar */}
            <div className="demographics-ratio-track">
              {femalePct > 0 && (
                <div
                  className="demographics-segment-female"
                  style={{ width: `${femalePct}%` }}
                  title={`Female: ${femaleStudents.length} (${femalePct}%)`}
                />
              )}
              {malePct > 0 && (
                <div
                  className="demographics-segment-male"
                  style={{ width: `${malePct}%` }}
                  title={`Male: ${maleStudents.length} (${malePct}%)`}
                />
              )}
              {otherPct > 0 && (
                <div
                  className="demographics-segment-other"
                  style={{ width: `${otherPct}%` }}
                  title={`Other: ${otherStudents.length} (${otherPct}%)`}
                />
              )}
            </div>

            {/* Profile cards */}
            <div className="demographics-cards-grid">
              <div className="demo-card-item">
                <div className="demo-icon-box demo-female-box">
                  <User size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Female</div>
                  <div className="text-base font-bold text-slate-800 leading-tight">
                    {femaleStudents.length} <span className="text-xs text-pink-600 font-semibold">({femalePct}%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Avg:{' '}
                    {money(
                      femaleStudents.length
                        ? femaleStudents.reduce((a, s) => a + s.total, 0) / femaleStudents.length
                        : 0,
                    )}
                  </div>
                </div>
              </div>

              <div className="demo-card-item">
                <div className="demo-icon-box demo-male-box">
                  <User size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Male</div>
                  <div className="text-base font-bold text-slate-800 leading-tight">
                    {maleStudents.length} <span className="text-xs text-blue-600 font-semibold">({malePct}%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Avg:{' '}
                    {money(
                      maleStudents.length ? maleStudents.reduce((a, s) => a + s.total, 0) / maleStudents.length : 0,
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Transactions Panel */}
      <section className="panel table-panel" style={{ marginTop: 20 }}>
        <div className="panel-header">
          <div>
            <h2>Recent transactions</h2>
            <p>{filteredPayments.length} payment records in selected period</p>
          </div>
        </div>
        <PaymentsTable
          payments={filteredPayments.slice(0, 10)}
          onInvoice={(p) => {
            window.location.assign(`/invoices/${encodeURIComponent(p.invoice)}`)
          }}
        />
      </section>
    </>
  )
}
