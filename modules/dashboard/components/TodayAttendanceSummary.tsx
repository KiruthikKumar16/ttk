'use client'

import React, { CSSProperties } from 'react'
import Link from 'next/link'
import { Cell, Pie, PieChart } from 'recharts'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

export interface TodayAttendanceSummaryProps {
  present: number
  absent: number
  totalMarked: number
  rate: number
  linkHref?: string
  linkLabel?: string
  className?: string
}

const chartConfig = {
  present: {
    label: 'Present',
    color: '#10b981',
  },
  absent: {
    label: 'Absent',
    color: '#f43f5e',
  },
} satisfies ChartConfig

export function TodayAttendanceSummary({
  present,
  absent,
  totalMarked,
  rate,
  linkHref = '/attendance',
  linkLabel = 'Attendance Registry',
  className = '',
}: TodayAttendanceSummaryProps) {
  const isEmpty = present === 0 && absent === 0

  const chartData = isEmpty
    ? [{ status: 'present', count: 1, fill: 'rgba(148, 163, 184, 0.18)' }]
    : [
        { status: 'present', count: present, fill: 'url(#attendance-present-pattern)' },
        { status: 'absent', count: absent, fill: 'url(#attendance-absent-pattern)' },
      ]

  return (
    <div
      className={`panel p-5 flex flex-col justify-between transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_var(--g1b,rgba(0,0,0,0.12))] hover:border-[var(--g5)] ${className}`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Attendance Summary</h2>
          </div>
          <Link
            href={linkHref}
            className="group text-xs font-semibold flex items-center gap-1 text-[var(--g1)] hover:underline underline-offset-4 decoration-[var(--g1)] transition-all cursor-pointer"
            style={{ color: 'var(--g1)' }}
          >
            <span>{linkLabel}</span>
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Chart & Stats Section */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Donut Pattern Chart (inspired by c-chart-21) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square w-full max-w-[170px] max-h-[170px]"
            >
              <PieChart accessibilityLayer>
                <defs>
                  {/* Present Pattern: Subtle diagonal hatch on emerald */}
                  <pattern
                    id="attendance-present-pattern"
                    patternUnits="userSpaceOnUse"
                    width="6"
                    height="6"
                  >
                    <rect width="6" height="6" fill="#10b981" opacity="0.25" />
                    <path
                      d="M0,6 L6,0 M-2,2 L2,-2 M4,8 L8,4"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      opacity="0.95"
                    />
                  </pattern>

                  {/* Absent Pattern: Dot matrix on rose */}
                  <pattern
                    id="attendance-absent-pattern"
                    patternUnits="userSpaceOnUse"
                    width="5"
                    height="5"
                  >
                    <rect width="5" height="5" fill="#f43f5e" opacity="0.2" />
                    <circle cx="2.5" cy="2.5" r="1.3" fill="#f43f5e" opacity="0.9" />
                  </pattern>
                </defs>

                {!isEmpty && (
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="min-w-36 gap-2"
                        formatter={(value, name) => {
                          const total = present + absent
                          const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0
                          const label = chartConfig[name as keyof typeof chartConfig]?.label || name
                          const color = name === 'present' ? '#10b981' : '#f43f5e'
                          return (
                            <div className="flex w-full items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-2.5 w-2.5 rounded-[2px]"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-muted-foreground font-medium">{label}</span>
                              </div>
                              <span className="font-semibold tabular-nums text-foreground">
                                {Number(value)} ({pct}%)
                              </span>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                )}

                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={40}
                  outerRadius={65}
                  cornerRadius={4}
                  paddingAngle={isEmpty ? 0 : 3}
                  stroke="var(--card)"
                  strokeWidth={2.5}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Center rate badge inside donut */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-extrabold text-slate-900 leading-none">
                {isEmpty ? '0%' : `${rate}%`}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">
                {isEmpty ? 'No data' : 'Present'}
              </span>
            </div>
          </div>

          {/* Stats Cards (Strictly Present & Absent - no Late) */}
          <div className="md:col-span-7 grid grid-cols-2 gap-2.5">
            {/* Present Pill */}
            <div
              className="relative p-3 rounded-xl border flex flex-col justify-between transition-transform duration-200 ease-out hover:scale-105 hover:z-10 cursor-pointer"
              style={{
                background: 'rgba(236, 253, 245, 0.65)',
                borderColor: 'rgba(167, 243, 208, 0.7)',
              }}
            >
              <div className="flex items-center">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Present</p>
              </div>
              <p className="text-2xl font-extrabold text-emerald-950 mt-1">{present}</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">
                {totalMarked > 0 ? `${rate}% of marked` : 'Students present'}
              </p>
            </div>

            {/* Absent Pill */}
            <div
              className="relative p-3 rounded-xl border flex flex-col justify-between transition-transform duration-200 ease-out hover:scale-105 hover:z-10 cursor-pointer"
              style={{
                background: 'rgba(255, 241, 242, 0.65)',
                borderColor: 'rgba(254, 205, 211, 0.7)',
              }}
            >
              <div className="flex items-center">
                <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Absent</p>
              </div>
              <p className="text-2xl font-extrabold text-rose-950 mt-1">{absent}</p>
              <p className="text-[10px] text-rose-700 mt-0.5">
                {totalMarked > 0 ? `${100 - rate}% of marked` : 'Marked absent'}
              </p>
            </div>

            {/* Total Logged Pill (spans full width of the 2 cols) */}
            <div
              className="relative col-span-2 p-2.5 px-3.5 rounded-xl border flex items-center justify-between transition-transform duration-200 ease-out hover:scale-105 hover:z-10 cursor-pointer"
              style={{
                background: 'rgba(248, 250, 252, 0.85)',
                borderColor: 'rgba(226, 232, 240, 0.85)',
              }}
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-700">Total Marked Records</p>
                <p className="text-[10px] text-slate-500">
                  {totalMarked === 0 ? 'No sessions logged today' : `${totalMarked} students evaluated today`}
                </p>
              </div>
              <span className="text-xl font-bold text-slate-900">{totalMarked}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Progress Bar */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
          <span>Classroom Attendance Health</span>
          <span className="font-bold text-slate-900">{rate}% Present</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, rate))}%`,
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.35)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default TodayAttendanceSummary
