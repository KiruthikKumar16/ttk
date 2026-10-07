'use client'

import { useState, useEffect, useMemo } from 'react'
import { CircleDollarSign, GraduationCap } from 'lucide-react'
import type { Student, Payment, Course, CourseCategory } from '@/lib/types'
import type { AcademicReportData } from '@/modules/reports/service'
import { ReportsView } from '@/modules/reports/components/ReportsView'
import { StaffReportsView } from '@/modules/reports/components/StaffReportsView'

interface AdminReportsClientProps {
  students: Student[]
  payments: Payment[]
  academicData: AcademicReportData
  categories?: CourseCategory[]
  courses?: Course[]
}

export function AdminReportsClient({
  students,
  payments,
  academicData,
  categories = [],
  courses = [],
}: AdminReportsClientProps) {
  const [activeView, setActiveView] = useState<'financial' | 'staff'>('financial')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_reports_active_view')
      if (saved === 'financial' || saved === 'staff') {
        setActiveView(saved)
      }
    } catch {
      // Storage access blocked or unavailable
    }
  }, [])

  const handleViewChange = (view: 'financial' | 'staff') => {
    setActiveView(view)
    try {
      localStorage.setItem('admin_reports_active_view', view)
    } catch {
      // Storage access blocked or unavailable
    }
  }

  const lowAttendanceCount = useMemo(() => {
    if (!academicData?.attendanceRecords?.length) return 0
    const map = new Map<number, { total: number; present: number }>()
    for (const r of academicData.attendanceRecords) {
      const reg = r.studentRegisterId
      if (!map.has(reg)) map.set(reg, { total: 0, present: 0 })
      const e = map.get(reg)!
      e.total += 1
      if (r.status === 'Present') e.present += 1
    }
    let count = 0
    for (const val of map.values()) {
      if (val.total > 0 && (val.present / val.total) * 100 < 75) {
        count += 1
      }
    }
    return count
  }, [academicData])

  return (
    <div className="space-y-6">
      {/* Admin View Switcher Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2 rounded-full bg-[var(--panel)] border border-[var(--border)] shadow-2xs">
        <div
          role="tablist"
          aria-label="Reports view toggle"
          className="inline-flex items-center p-1 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-2xs"
        >
          <button
            type="button"
            role="tab"
            id="admin-reports-toggle-financial"
            aria-selected={activeView === 'financial'}
            aria-controls="admin-reports-financial-panel"
            onClick={() => handleViewChange('financial')}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeView === 'financial' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={activeView === 'financial' ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' } : {}}
          >
            <CircleDollarSign size={14} />
            <span>Financial Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            id="admin-reports-toggle-staff"
            aria-selected={activeView === 'staff'}
            aria-controls="admin-reports-staff-panel"
            onClick={() => handleViewChange('staff')}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeView === 'staff' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={activeView === 'staff' ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' } : {}}
          >
            <GraduationCap size={14} />
            <span>Staff & Academic Data</span>
            {lowAttendanceCount > 0 && (
              <span
                className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeView === 'staff' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-[#854d0e]'
                }`}
              >
                {lowAttendanceCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-[var(--mute)] px-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1b7a4b] shrink-0" />
          <span>
            {activeView === 'financial'
              ? 'Displaying tuition velocity, collections, payment breakdown & demographics'
              : 'Displaying classroom attendance records, assessment evaluations & pass rates'}
          </span>
        </div>
      </div>

      {/* Active Panel View */}
      {activeView === 'financial' ? (
        <div id="admin-reports-financial-panel" role="tabpanel" aria-labelledby="admin-reports-toggle-financial">
          <ReportsView students={students} payments={payments} categories={categories} courses={courses} />
        </div>
      ) : (
        <div id="admin-reports-staff-panel" role="tabpanel" aria-labelledby="admin-reports-toggle-staff">
          <StaffReportsView students={students} academicData={academicData} categories={categories} courses={courses} />
        </div>
      )}
    </div>
  )
}
