'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
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
  PieChart as PieChartIcon,
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
  Megaphone,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import type { Payment, Student, Course, CourseCategory } from '@/lib/types'
import { money } from '@/lib/formatters'
import { PaymentsTable } from '@/components/shared/PaymentsTable'
import { KpiCard } from '@/components/ui/KpiCard'

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

function getCourseShortName(name: string): string {
  const clean = name
    .replace(/^[-–—\s]+/, '')
    .replace(/^ThoorigAI\s+/i, '')
    .replace(/\s+Course$/i, '')
    .trim()
  if (clean.length <= 14) return clean
  if (/data science/i.test(clean) || /ai/i.test(clean)) return 'AI & DS'
  if (/full\s*stack/i.test(clean)) return 'Full Stack'
  return clean.slice(0, 12) + '…'
}

type CourseEnrollmentChartProps = {
  courseCounts: Record<string, number>
  totalStudents: number
}

function CourseEnrollmentChart({ courseCounts, totalStudents }: CourseEnrollmentChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [displayValue, setDisplayValue] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const courses = useMemo(() => {
    return Object.entries(courseCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => {
        const shortName = getCourseShortName(name)
        const sharePct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
        return {
          name,
          shortName,
          count,
          sharePct,
        }
      })
  }, [courseCounts, totalStudents])

  const maxValue = useMemo(() => Math.max(...courses.map((c) => c.count), 1), [courses])

  useEffect(() => {
    if (hoveredIndex !== null && courses[hoveredIndex]) {
      setDisplayValue(courses[hoveredIndex].count)
    }
  }, [hoveredIndex, courses])

  const handleContainerEnter = () => setIsHovering(true)
  const handleContainerLeave = () => {
    setIsHovering(false)
    setHoveredIndex(null)
    setTimeout(() => {
      setDisplayValue(null)
    }, 150)
  }

  const activeCourse = hoveredIndex !== null ? courses[hoveredIndex] : null

  if (courses.length === 0) {
    return <p className="empty-note">No course enrollment data in this period.</p>
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleContainerEnter}
      onMouseLeave={handleContainerLeave}
      className="group relative w-full p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] transition-all duration-500 hover:border-[var(--g5)] flex flex-col gap-4 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-end mb-1">
        <div className="relative h-7 flex items-center">
          {activeCourse ? (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <span className="text-xs font-medium text-[var(--mute)] max-w-[120px] sm:max-w-[180px] truncate">
                {activeCourse.shortName}:
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-[var(--ink)] tabular-nums">
                {activeCourse.count}
                <span className="text-xs font-normal text-[var(--mute)] ml-0.5">std</span>
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[var(--g5)] text-[var(--g1b)]"
                style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
              >
                {activeCourse.sharePct}%
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-[var(--mute)]">
              <span>Total Cohort:</span>
              <span className="text-base font-bold font-mono text-[var(--ink)] tabular-nums">
                {totalStudents}
              </span>
              <span className="text-xs">std</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Bar Chart Area */}
      <div className="relative h-44 w-full pt-4 pb-8 flex items-end">
        {/* Dashed background guidelines */}
        <div className="absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
          <div className="border-b border-dashed border-[var(--border)] w-full relative">
            <span className="absolute right-0 -top-4 text-[10px] font-mono text-[var(--mute)]">
              {maxValue} std
            </span>
          </div>
          <div className="border-b border-dashed border-[var(--border)] w-full relative">
            <span className="absolute right-0 -top-4 text-[10px] font-mono text-[var(--mute)]">
              {Math.max(1, Math.round(maxValue / 2))} std
            </span>
          </div>
          <div className="border-b border-dashed border-[var(--border)] w-full relative">
            <span className="absolute right-0 -top-4 text-[10px] font-mono text-[var(--mute)]">
              0
            </span>
          </div>
        </div>

        {/* Bars */}
        <div className="relative z-10 w-full h-full flex items-end justify-around gap-2 sm:gap-3 px-1">
          {courses.map((item, index) => {
            const heightPx = Math.max(22, Math.round((item.count / maxValue) * 105))
            const isHovered = hoveredIndex === index
            const isAnyHovered = hoveredIndex !== null
            const isNeighbor =
              hoveredIndex !== null && (index === hoveredIndex - 1 || index === hoveredIndex + 1)

            return (
              <div
                key={item.name}
                className="relative flex-1 flex flex-col items-center justify-end h-full"
                onMouseEnter={() => setHoveredIndex(index)}
              >
                {/* Count badge on top of bar */}
                <span
                  className={cn(
                    'text-[10px] font-bold font-mono mb-1.5 transition-all duration-300',
                    isHovered ? 'text-[var(--g1b)] scale-110' : 'text-[var(--mute)]',
                  )}
                >
                  {item.count}
                </span>

                {/* Pill-shaped Bar */}
                <div
                  className={cn(
                    'w-full max-w-[34px] sm:max-w-[42px] rounded-full cursor-pointer transition-all duration-300 ease-out origin-bottom',
                  )}
                  style={{
                    height: `${heightPx}px`,
                    background: isHovered
                      ? 'linear-gradient(180deg, var(--g1) 0%, var(--g1b) 100%)'
                      : isNeighbor
                        ? 'var(--g1)'
                        : isAnyHovered
                          ? 'var(--g1)'
                          : 'linear-gradient(180deg, var(--g1) 0%, var(--g3) 100%)',
                    opacity: isHovered ? 1 : isNeighbor ? 0.6 : isAnyHovered ? 0.2 : 0.85,
                    boxShadow: isHovered ? '0 0 16px var(--g4)' : 'none',
                    transform: isHovered
                      ? 'scaleX(1.15) scaleY(1.03)'
                      : isNeighbor
                        ? 'scaleX(1.05)'
                        : 'scaleX(1)',
                  }}
                />

                {/* Label under bar */}
                <span
                  className={cn(
                    'absolute -bottom-6 w-full text-[10px] font-medium text-center truncate transition-all duration-300 select-none',
                    isHovered ? 'text-[var(--g1b)] font-bold' : 'text-[var(--mute)]',
                  )}
                  title={item.name}
                >
                  {item.shortName}
                </span>

                {/* Floating Tooltip */}
                <div
                  className={cn(
                    'absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-xs font-medium transition-all duration-200 whitespace-nowrap z-30 pointer-events-none flex flex-col items-center gap-0.5',
                    isHovered
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-2 scale-95 pointer-events-none',
                  )}
                >
                  <span className="text-[11px] font-bold text-[var(--ink)]">{item.name}</span>
                  <span className="text-[10px] text-[var(--g1b)] font-mono font-semibold">
                    {item.count} std ({item.sharePct}%)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[var(--g4)]/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  )
}

type PaymentClearanceProps = {
  collectionRate: number
  fullyPaid: number
  pending: number
  totalStudents: number
  totalPaid: number
  outstanding: number
}

function PaymentClearanceChart({
  collectionRate,
  fullyPaid,
  pending,
  totalStudents,
  totalPaid,
  outstanding,
}: PaymentClearanceProps) {
  const [activeName, setActiveName] = useState<string | null>(null)

  const data = useMemo(() => {
    return [
      {
        name: 'Fully Cleared',
        value: Math.max(0, fullyPaid),
        count: fullyPaid,
        pct: totalStudents ? Math.round((fullyPaid / totalStudents) * 100) : 0,
        fill: 'var(--g1)',
      },
      {
        name: 'Pending Dues',
        value: Math.max(0, pending),
        count: pending,
        pct: totalStudents ? Math.round((pending / totalStudents) * 100) : 0,
        fill: 'var(--g3)',
      },
    ]
  }, [fullyPaid, pending, totalStudents])

  const chartConfig = {
    fullyCleared: { label: 'Fully Cleared', color: 'var(--g1)' },
    pendingDues: { label: 'Pending Dues', color: 'var(--g3)' },
  } satisfies ChartConfig

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 sm:p-5 items-center">
      {/* Padded Donut Chart with Centered Clearance Ratio */}
      <div className="md:col-span-5 relative flex items-center justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[220px] w-full"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="min-w-[10rem] p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xl"
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-3 text-xs">
                      <span className="text-[var(--mute)]">Students:</span>
                      <span className="font-bold text-[var(--ink)] font-mono">
                        {item.payload.count} ({item.payload.pct}%)
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={85}
              paddingAngle={6}
              cornerRadius={8}
              animationDuration={800}
              onMouseLeave={() => setActiveName(null)}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.fill}
                  stroke="var(--card)"
                  strokeWidth={2}
                  style={{
                    opacity: activeName === null || activeName === entry.name ? 1 : 0.35,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setActiveName(entry.name)}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Center ratio label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
          <span className="text-2xl font-extrabold font-mono text-[var(--ink)] tracking-tight">
            {activeName === 'Fully Cleared'
              ? `${totalStudents ? Math.round((fullyPaid / totalStudents) * 100) : 0}%`
              : activeName === 'Pending Dues'
                ? `${totalStudents ? Math.round((pending / totalStudents) * 100) : 0}%`
                : `${collectionRate}%`}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--mute)] max-w-[100px] truncate text-center">
            {activeName ? activeName : 'Settled'}
          </span>
        </div>
      </div>

      {/* Modern Status Cards Stack */}
      <div className="md:col-span-7 flex flex-col gap-3">
        {/* Card 1: Fully Cleared */}
        <div
          className={cn(
            'p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer',
            activeName === 'Fully Cleared'
              ? 'border-[var(--g1)] bg-[var(--card)] shadow-lg scale-[1.02] -translate-y-0.5'
              : activeName !== null
                ? 'border-[var(--border)] bg-[var(--panel)]/40 opacity-40'
                : 'border-[var(--border)] bg-[var(--panel)]/50 hover:bg-[var(--card)] hover:border-[var(--g5)]',
          )}
          onMouseEnter={() => setActiveName('Fully Cleared')}
          onMouseLeave={() => setActiveName(null)}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all',
                  activeName === 'Fully Cleared'
                    ? 'border-[var(--g1)] ring-2 ring-[var(--g1)]/30 text-[var(--g1)]'
                    : 'border-[var(--g5)] text-[var(--g1)]',
                )}
                style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
              >
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--ink)]">Fully Cleared</h4>
                <p className="text-[10px] text-[var(--mute)]">Ready for certificate</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  'text-base font-mono block transition-transform',
                  activeName === 'Fully Cleared'
                    ? 'font-extrabold text-[var(--ink)] scale-110'
                    : 'font-bold text-[var(--ink)]',
                )}
              >
                {fullyPaid}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-all inline-block"
                style={{
                  background:
                    activeName === 'Fully Cleared'
                      ? 'var(--g1)'
                      : 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)',
                  color: activeName === 'Fully Cleared' ? '#fff' : 'var(--g1b)',
                  borderColor: activeName === 'Fully Cleared' ? 'var(--g1)' : 'var(--g5)',
                }}
              >
                {totalStudents ? Math.round((fullyPaid / totalStudents) * 100) : 0}% cohort
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[10px] text-[var(--mute)]">
            <span>Collected Fees</span>
            <span
              className={cn(
                'font-mono font-bold transition-colors',
                activeName === 'Fully Cleared' ? 'text-[var(--g1b)]' : 'text-[var(--ink)]',
              )}
            >
              {money(totalPaid)}
            </span>
          </div>
        </div>

        {/* Card 2: Pending Dues */}
        <div
          className={cn(
            'p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer',
            activeName === 'Pending Dues'
              ? 'border-[var(--g1b)] bg-[var(--card)] shadow-lg scale-[1.02] -translate-y-0.5'
              : activeName !== null
                ? 'border-[var(--border)] bg-[var(--panel)]/40 opacity-40'
                : 'border-[var(--border)] bg-[var(--panel)]/50 hover:bg-[var(--card)] hover:border-[var(--g5)]',
          )}
          onMouseEnter={() => setActiveName('Pending Dues')}
          onMouseLeave={() => setActiveName(null)}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all',
                  activeName === 'Pending Dues'
                    ? 'border-[var(--g1b)] ring-2 ring-[var(--g1b)]/30 text-[var(--g1b)]'
                    : 'border-[var(--g5)] text-[var(--g1b)]',
                )}
                style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
              >
                <Clock size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--ink)]">Pending Dues</h4>
                <p className="text-[10px] text-[var(--mute)]">
                  {money(outstanding)} due
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  'text-base font-mono block transition-transform',
                  activeName === 'Pending Dues'
                    ? 'font-extrabold text-[var(--ink)] scale-110'
                    : 'font-bold text-[var(--ink)]',
                )}
              >
                {pending}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-all inline-block"
                style={{
                  background:
                    activeName === 'Pending Dues'
                      ? 'var(--g1b)'
                      : 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)',
                  color: activeName === 'Pending Dues' ? '#fff' : 'var(--g1b)',
                  borderColor: activeName === 'Pending Dues' ? 'var(--g1b)' : 'var(--g5)',
                }}
              >
                {totalStudents ? Math.round((pending / totalStudents) * 100) : 0}% cohort
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[10px] text-[var(--mute)]">
            <span>Receivable Balance</span>
            <span
              className={cn(
                'font-mono font-bold transition-colors',
                activeName === 'Pending Dues' ? 'text-[var(--g1b)]' : 'text-[var(--ink)]',
              )}
            >
              {money(outstanding)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

type GenderDemographicsProps = {
  femaleStudents: Student[]
  maleStudents: Student[]
  otherStudents: Student[]
  femalePct: number
  malePct: number
  otherPct: number
}

function GenderDemographicsChart({
  femaleStudents,
  maleStudents,
  otherStudents,
  femalePct,
  malePct,
  otherPct,
}: GenderDemographicsProps) {
  const [activeGender, setActiveGender] = useState<'Female' | 'Male' | 'Other' | null>(null)

  const femaleAvg = femaleStudents.length
    ? Math.round(femaleStudents.reduce((a, s) => a + s.total, 0) / femaleStudents.length)
    : 0
  const maleAvg = maleStudents.length
    ? Math.round(maleStudents.reduce((a, s) => a + s.total, 0) / maleStudents.length)
    : 0

  const total = femaleStudents.length + maleStudents.length + otherStudents.length

  if (total === 0) {
    return <p className="empty-note">No demographic data in this period.</p>
  }

  return (
    <div className="p-4 sm:p-5 flex flex-col gap-5">
      {/* ── Partition Bar ── */}
      <div className="w-full flex flex-col gap-2">
        {/* Track with proportional pills forming a light-to-dark gradient strip */}
        <div className="w-full flex items-center gap-1.5 h-3.5">
          {femalePct > 0 && (
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300 cursor-pointer',
                activeGender === 'Female' ? 'ring-2 ring-[var(--g1)] shadow-md' : '',
              )}
              style={{
                width: `${femalePct}%`,
                background: 'linear-gradient(90deg, var(--g3) 0%, var(--g1) 100%)',
                opacity: activeGender === null || activeGender === 'Female' ? 1 : 0.35,
              }}
              onMouseEnter={() => setActiveGender('Female')}
              onMouseLeave={() => setActiveGender(null)}
              title={`Female: ${femaleStudents.length} (${femalePct}%) — Light Theme Tone`}
            />
          )}
          {malePct > 0 && (
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300 cursor-pointer',
                activeGender === 'Male' ? 'ring-2 ring-[var(--g1b)] shadow-md' : '',
              )}
              style={{
                width: `${malePct}%`,
                background: 'linear-gradient(90deg, var(--g1b) 0%, var(--g2b) 100%)',
                opacity: activeGender === null || activeGender === 'Male' ? 1 : 0.35,
              }}
              onMouseEnter={() => setActiveGender('Male')}
              onMouseLeave={() => setActiveGender(null)}
              title={`Male: ${maleStudents.length} (${malePct}%) — Dark Theme Tone`}
            />
          )}
          {otherPct > 0 && (
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300 cursor-pointer',
                activeGender === 'Other' ? 'ring-2 ring-[var(--g5)] shadow-md' : '',
              )}
              style={{
                width: `${otherPct}%`,
                background: 'var(--g5)',
                opacity: activeGender === null || activeGender === 'Other' ? 1 : 0.35,
              }}
              onMouseEnter={() => setActiveGender('Other')}
              onMouseLeave={() => setActiveGender(null)}
              title={`Other: ${otherStudents.length} (${otherPct}%)`}
            />
          )}
        </div>

        {/* Partition Labels directly below bar */}
        <div className="flex items-center justify-between text-xs text-[var(--mute)] px-0.5">
          <div
            className={cn(
              'flex flex-col items-start transition-all duration-200 cursor-pointer',
              activeGender === 'Female'
                ? 'text-[var(--g1)] font-bold scale-105'
                : activeGender !== null
                  ? 'opacity-40'
                  : '',
            )}
            onMouseEnter={() => setActiveGender('Female')}
            onMouseLeave={() => setActiveGender(null)}
          >
            <span className="font-semibold text-xs text-[var(--ink)]">Female</span>
            <span className="text-[11px] font-mono font-medium">
              {femaleStudents.length} ({femalePct}%)
            </span>
          </div>

          <div
            className={cn(
              'flex flex-col items-end transition-all duration-200 cursor-pointer',
              activeGender === 'Male'
                ? 'text-[var(--g1b)] font-bold scale-105'
                : activeGender !== null
                  ? 'opacity-40'
                  : '',
            )}
            onMouseEnter={() => setActiveGender('Male')}
            onMouseLeave={() => setActiveGender(null)}
          >
            <span className="font-semibold text-xs text-[var(--ink)]">Male</span>
            <span className="text-[11px] font-mono font-medium">
              {maleStudents.length} ({malePct}%)
            </span>
          </div>
        </div>
      </div>

      {/* ── Interactive Demographic Profile Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Female Card */}
        <div
          className={cn(
            'p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-2',
            activeGender === 'Female'
              ? 'border-[var(--g1)] bg-[var(--card)] shadow-lg scale-[1.02] -translate-y-0.5'
              : activeGender !== null
                ? 'border-[var(--border)] bg-[var(--panel)]/40 opacity-40'
                : 'border-[var(--border)] bg-[var(--panel)]/50 hover:bg-[var(--card)] hover:border-[var(--g5)]',
          )}
          onMouseEnter={() => setActiveGender('Female')}
          onMouseLeave={() => setActiveGender(null)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all',
                  activeGender === 'Female'
                    ? 'border-[var(--g1)] ring-2 ring-[var(--g1)]/30 text-[var(--g1)]'
                    : 'border-[var(--g5)] text-[var(--g1)]',
                )}
                style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
              >
                <User size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--ink)] block">Female</span>
                <span className="text-[10px] text-[var(--mute)]">Cohort ratio</span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  'text-base font-mono block transition-transform',
                  activeGender === 'Female'
                    ? 'font-extrabold text-[var(--ink)] scale-110'
                    : 'font-bold text-[var(--ink)]',
                )}
              >
                {femaleStudents.length}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-all inline-block"
                style={{
                  background:
                    activeGender === 'Female'
                      ? 'var(--g1)'
                      : 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)',
                  color: activeGender === 'Female' ? '#fff' : 'var(--g1b)',
                  borderColor: activeGender === 'Female' ? 'var(--g1)' : 'var(--g5)',
                }}
              >
                {femalePct}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[10px] text-[var(--mute)]">
            <span>Avg Tuition</span>
            <span
              className={cn(
                'font-mono font-bold transition-colors',
                activeGender === 'Female' ? 'text-[var(--g1b)]' : 'text-[var(--ink)]',
              )}
            >
              {money(femaleAvg)}
            </span>
          </div>
        </div>

        {/* Male Card */}
        <div
          className={cn(
            'p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-2',
            activeGender === 'Male'
              ? 'border-[var(--g1)] bg-[var(--card)] shadow-lg scale-[1.02] -translate-y-0.5'
              : activeGender !== null
                ? 'border-[var(--border)] bg-[var(--panel)]/40 opacity-40'
                : 'border-[var(--border)] bg-[var(--panel)]/50 hover:bg-[var(--card)] hover:border-[var(--g5)]',
          )}
          onMouseEnter={() => setActiveGender('Male')}
          onMouseLeave={() => setActiveGender(null)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all',
                  activeGender === 'Male'
                    ? 'border-[var(--g1)] ring-2 ring-[var(--g1)]/30 text-[var(--g1)]'
                    : 'border-[var(--g5)] text-[var(--g1)]',
                )}
                style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
              >
                <User size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--ink)] block">Male</span>
                <span className="text-[10px] text-[var(--mute)]">Cohort ratio</span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  'text-base font-mono block transition-transform',
                  activeGender === 'Male'
                    ? 'font-extrabold text-[var(--ink)] scale-110'
                    : 'font-bold text-[var(--ink)]',
                )}
              >
                {maleStudents.length}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-all inline-block"
                style={{
                  background:
                    activeGender === 'Male'
                      ? 'var(--g1)'
                      : 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)',
                  color: activeGender === 'Male' ? '#fff' : 'var(--g1b)',
                  borderColor: activeGender === 'Male' ? 'var(--g1)' : 'var(--g5)',
                }}
              >
                {malePct}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[10px] text-[var(--mute)]">
            <span>Avg Tuition</span>
            <span
              className={cn(
                'font-mono font-bold transition-colors',
                activeGender === 'Male' ? 'text-[var(--g1b)]' : 'text-[var(--ink)]',
              )}
            >
              {money(maleAvg)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

type PaymentMethodTotalsProps = {
  paymentChartData: Array<{
    key: string
    method: string
    amount: number
    count: number
    fill: string
  }>
  paymentChartConfig: ChartConfig
  revenue: number
}

function PaymentMethodTotalsChart({
  paymentChartData,
  paymentChartConfig,
  revenue,
}: PaymentMethodTotalsProps) {
  const [activeMethod, setActiveMethod] = useState<string | null>(null)

  const activeItem = activeMethod
    ? paymentChartData.find((item) => item.method === activeMethod)
    : null

  if (paymentChartData.length === 0) {
    return <p className="empty-note">No payments recorded in selected period.</p>
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2 sm:p-4">
      {/* Donut Chart */}
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <ChartContainer
          config={paymentChartConfig}
          className="mx-auto aspect-square max-h-[280px] min-h-[220px] w-full max-w-[280px]"
        >
          <PieChart onMouseLeave={() => setActiveMethod(null)}>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="min-w-[12rem] p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xl"
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ background: item.payload?.fill || 'var(--g1)' }}
                        />
                        <span className="font-semibold text-[var(--ink)]">
                          {item.payload?.method || name}
                        </span>
                        <span className="text-[10px] text-[var(--mute)]">
                          ({item.payload?.count ?? 1} tx)
                        </span>
                      </div>
                      <span className="font-bold text-[var(--ink)] font-mono">
                        {money(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={paymentChartData}
              dataKey="amount"
              nameKey="method"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              cornerRadius={8}
              strokeWidth={2}
              stroke="var(--card)"
              animationDuration={800}
              onMouseLeave={() => setActiveMethod(null)}
            >
              {paymentChartData.map((entry) => {
                const isHovered = activeMethod === entry.method
                const isAnyHovered = activeMethod !== null

                return (
                  <Cell
                    key={entry.method}
                    fill={entry.fill}
                    stroke="var(--card)"
                    strokeWidth={isHovered ? 3 : 2}
                    style={{
                      opacity: isAnyHovered ? (isHovered ? 1 : 0.35) : 1,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setActiveMethod(entry.method)}
                  />
                )
              })}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 2}
                          className="fill-[var(--ink)] text-xl sm:text-2xl font-bold font-mono tracking-tight"
                        >
                          {activeItem ? money(activeItem.amount) : money(revenue)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-[var(--mute)] text-xs font-semibold uppercase tracking-wider"
                        >
                          {activeItem
                            ? `${activeItem.method} (${revenue > 0 ? Math.round((activeItem.amount / revenue) * 100) : 0}%)`
                            : 'Collected'}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>

      {/* Options List with Interactive Synchronized Hover */}
      <div className="w-full md:w-1/2 flex flex-col gap-2.5">
        {paymentChartData.map((item) => {
          const isHovered = activeMethod === item.method
          const isAnyHovered = activeMethod !== null
          const pct = revenue > 0 ? Math.round((item.amount / revenue) * 100) : 0

          return (
            <div
              key={item.method}
              onMouseEnter={() => setActiveMethod(item.method)}
              onMouseLeave={() => setActiveMethod(null)}
              className={cn(
                'flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 cursor-pointer',
                isHovered
                  ? 'bg-[var(--card)] shadow-lg scale-[1.02] -translate-y-0.5'
                  : isAnyHovered
                    ? 'bg-[var(--panel)]/40 border-[var(--border)] opacity-40'
                    : 'bg-[var(--panel)] border-[var(--border)] hover:bg-[var(--card)]',
              )}
              style={{
                borderColor: isHovered ? item.fill : undefined,
                boxShadow: isHovered ? `0 4px 18px -2px ${item.fill}40` : undefined,
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    'rounded-full shrink-0 transition-all duration-300',
                    isHovered ? 'w-3 h-3 ring-4 ring-[var(--g4)]' : 'w-2.5 h-2.5',
                  )}
                  style={{ background: item.fill }}
                />
                <strong
                  className={cn(
                    'text-xs transition-colors truncate',
                    isHovered ? 'text-[var(--ink)] font-bold' : 'text-[var(--ink)] font-semibold',
                  )}
                >
                  {item.method}
                </strong>
                <span className="text-[10px] text-[var(--mute)] shrink-0 font-medium font-mono">
                  ({item.count} tx)
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold font-mono text-[var(--ink)]">
                  {money(item.amount)}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all"
                  style={{
                    background: isHovered
                      ? item.fill
                      : 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)',
                    color: isHovered ? '#fff' : 'var(--g1b)',
                    borderColor: isHovered ? item.fill : 'var(--g5)',
                  }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
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

  const radarChartData = useMemo(() => {
    return Object.entries(studentSourceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => {
        const pct = students.length ? Math.round((count / students.length) * 100) : 0
        return {
          channel,
          students: count,
          sharePct: pct,
        }
      })
  }, [studentSourceCounts, students.length])

  const radarChartConfig = {
    students: {
      label: 'Students',
      color: 'var(--g1)',
    },
  } satisfies ChartConfig

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

  const velocityChartData = useMemo(() => {
    return timelineEntries.map(([date, amount]) => {
      const parts = date.split(' ')
      const shortDate = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : date
      return {
        date: shortDate,
        fullDate: date,
        amount,
      }
    })
  }, [timelineEntries])

  const velocityChartConfig = {
    amount: {
      label: 'Inflow',
      color: 'var(--g1)',
    },
  } satisfies ChartConfig

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

  const themeGradientFills = [
    'var(--g1)',
    'var(--g2)',
    'var(--g3)',
    'var(--g1b)',
    'var(--g2b)',
    'var(--g5)',
  ]

  const paymentChartData = useMemo(() => {
    return Object.entries(methods)
      .sort((a, b) => b[1] - a[1])
      .map(([method, amount], idx) => {
        const key = method.toLowerCase().replace(/[^a-z0-9]/g, '_')
        const fill = themeGradientFills[idx % themeGradientFills.length]
        return {
          key,
          method,
          amount,
          count: methodCounts[method] || 1,
          fill,
        }
      })
  }, [methods, methodCounts])

  const paymentChartConfig = useMemo(() => {
    const cfg: ChartConfig = {
      amount: {
        label: 'Revenue (₹)',
      },
    }
    paymentChartData.forEach((item) => {
      cfg[item.key] = {
        label: item.method,
        color: item.fill,
      }
    })
    return cfg
  }, [paymentChartData])

  const sourceIcons: Record<string, typeof Globe> = {
    Website: Globe,
    'Social Media': Share2,
    'Campus Drive': Building,
    'Campus Seminar': Building,
    'Walk-in': Footprints,
    'Direct Walk-in': Footprints,
    Reference: Users,
    'Friend Referral': Users,
    'Online Advertisement': Megaphone,
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[var(--border)] mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--mute)]">OPERATIONS REPORTING</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Reports</h1>
          <p className="text-xs text-[var(--mute)] mt-1">
            Executive analytics — financial velocity, cohort enrollment, marketing channels, and collection insights.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-2xs">
            <label htmlFor="rep-start-date" className="text-xs font-bold text-[var(--mute)] pl-2">
              From
            </label>
            <div className="flex items-center gap-1.5 text-xs text-[var(--mute)]">
              <Calendar size={14} className="text-[var(--mute)]" />
              <input
                id="rep-start-date"
                aria-label="Start date"
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="text-xs border border-[var(--border)] rounded-full px-2.5 py-1 bg-[var(--panel)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)]"
              />
            </div>
            <label htmlFor="rep-end-date" className="text-xs font-bold text-[var(--mute)]">
              To
            </label>
            <div className="flex items-center gap-1.5 text-xs text-[var(--mute)] pr-1">
              <Calendar size={14} className="text-[var(--mute)]" />
              <input
                id="rep-end-date"
                aria-label="End date"
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="text-xs border border-[var(--border)] rounded-full px-2.5 py-1 bg-[var(--panel)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)]"
              />
            </div>
          </div>
          <button
            onClick={download}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 shrink-0 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }}
          >
            <FileText size={15} />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4x2 BALANCED KPI METRICS GRID (8 Comprehensive Metrics)
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Row 1: Financial Performance */}
        <KpiCard
          title="Revenue collected"
          value={money(revenue)}
          subtitle="In selected period"
          icon={CircleDollarSign}
        />

        <KpiCard title="Total course fees" value={money(totalFees)} subtitle="Enrolled cohort value" icon={Wallet} />

        <KpiCard
          title="Outstanding balance"
          value={money(outstanding)}
          subtitle="Pending collection"
          icon={ArrowDownRight}
        />

        <KpiCard
          title="Collection efficiency"
          value={`${collectionRate}%`}
          subtitle={`${money(totalPaid)} of ${money(totalFees)}`}
          icon={TrendingUp}
        />

        {/* Row 2: Operational Health & Demographics */}
        <KpiCard title="Total students" value={students.length} subtitle="Active enrollments" icon={Users} />

        <KpiCard title="Certificate eligible" value={fullyPaid} subtitle="100% fees cleared" icon={ShieldCheck} />

        <KpiCard title="Pending dues" value={pending} subtitle="Students with balance" icon={Clock} />

        <KpiCard
          title="Average course fee"
          value={money(avgFee)}
          subtitle="Per enrolled student"
          icon={GraduationCap}
        />
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
          </div>

          <PaymentMethodTotalsChart
            paymentChartData={paymentChartData}
            paymentChartConfig={paymentChartConfig}
            revenue={revenue}
          />
        </section>

        {/* ── GRAPH 2: Enrollment by Course (Interactive Density Bar Chart) ── */}
        <section className="panel report-side">
          <div className="panel-header chart-panel-header">
            <div>
              <h2>Enrollment by course</h2>
              <p>Student density across active training programs</p>
            </div>
          </div>

          <CourseEnrollmentChart courseCounts={courseCounts} totalStudents={students.length} />
        </section>

        {/* ── GRAPH 3: Acquisition Channels (Radar Chart) ── */}
        <section className="panel report-main">
          <div className="panel-header chart-panel-header">
            <div>
              <h2>Acquisition channels</h2>
              <p>How registered students discovered the institute</p>
            </div>
          </div>

          {radarChartData.length === 0 ? (
            <p className="empty-note">No acquisition source data in this period.</p>
          ) : (
            <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
              <ChartContainer
                config={radarChartConfig}
                className="mx-auto aspect-square max-h-[320px] w-full max-w-[440px]"
              >
                <RadarChart data={radarChartData} outerRadius="70%">
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        className="min-w-[10rem] p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xl"
                        formatter={(value, name, item) => (
                          <div className="flex w-full items-center justify-between gap-3 text-xs">
                            <span className="text-[var(--mute)]">Students:</span>
                            <span className="font-bold text-[var(--ink)] font-mono">
                              {value} ({item.payload.sharePct}%)
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <PolarAngleAxis
                    dataKey="channel"
                    tick={{ fill: 'var(--ink)', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarGrid stroke="var(--mute)" strokeOpacity={0.35} strokeWidth={1.2} />
                  <Radar
                    name="Students"
                    dataKey="students"
                    stroke="var(--g1)"
                    strokeWidth={2.5}
                    fill="var(--g1)"
                    fillOpacity={0.35}
                    dot={{ fill: 'var(--card)', stroke: 'var(--g1)', strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: 'var(--g1)', stroke: 'var(--card)', strokeWidth: 2, r: 6 }}
                  />
                </RadarChart>
              </ChartContainer>
            </div>
          )}
        </section>

        {/* ── GRAPH 4: Payment Cash Flow Velocity (Recharts Area Chart) ── */}
        <section className="panel report-side">
          <div className="panel-header chart-panel-header">
            <div>
              <h2>Payment cash flow velocity</h2>
              <p>Transaction inflow pattern across selected period</p>
            </div>
          </div>

          {velocityChartData.length === 0 ? (
            <p className="empty-note">No payment velocity data in this period.</p>
          ) : (
            <div className="p-3 sm:p-5 flex flex-col gap-3">
              <ChartContainer
                config={velocityChartConfig}
                className="aspect-auto h-[240px] w-full"
              >
                <AreaChart
                  data={velocityChartData}
                  margin={{ top: 12, right: 16, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--g1)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--g1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: 'var(--mute)', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    width={75}
                    tick={{ fill: 'var(--mute)', fontSize: 10 }}
                    tickFormatter={(val) => money(Number(val))}
                  />
                  <ChartTooltip
                    cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        className="min-w-[10rem] p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xl"
                        formatter={(value) => (
                          <div className="flex w-full items-center justify-between gap-3 text-xs">
                            <span className="text-[var(--mute)]">Inflow:</span>
                            <span className="font-bold text-[var(--ink)] font-mono">
                              {money(Number(value))}
                            </span>
                          </div>
                        )}
                        labelFormatter={(_, payload) => (
                          <span className="font-semibold text-xs text-[var(--ink)]">
                            {payload?.[0]?.payload?.fullDate || ''}
                          </span>
                        )}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--g1)"
                    strokeWidth={2.5}
                    fill="url(#velocityFill)"
                    dot={{ fill: 'var(--card)', stroke: 'var(--g1)', strokeWidth: 2, r: 3.5 }}
                    activeDot={{ fill: 'var(--g1)', stroke: 'var(--card)', strokeWidth: 2, r: 5.5 }}
                  />
                </AreaChart>
              </ChartContainer>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs text-[var(--mute)]">
                <span>
                  Period Inflow: <strong className="text-[var(--ink)] font-mono">{money(revenue)}</strong>
                </span>
                <span>
                  Avg Transaction:{' '}
                  <strong className="text-[var(--ink)] font-mono">
                    {money(filteredPayments.length ? Math.round(revenue / filteredPayments.length) : 0)}
                  </strong>
                </span>
              </div>
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
          </div>

          <PaymentClearanceChart
            collectionRate={collectionRate}
            fullyPaid={fullyPaid}
            pending={pending}
            totalStudents={students.length}
            totalPaid={totalPaid}
            outstanding={outstanding}
          />
        </section>

        {/* ── GRAPH 6: Gender Demographics ── */}
        <section className="panel report-side">
          <div className="panel-header chart-panel-header">
            <div>
              <h2>Gender demographics</h2>
              <p>Cohort gender distribution & representation</p>
            </div>
          </div>

          <GenderDemographicsChart
            femaleStudents={femaleStudents}
            maleStudents={maleStudents}
            otherStudents={otherStudents}
            femalePct={femalePct}
            malePct={malePct}
            otherPct={otherPct}
          />
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
