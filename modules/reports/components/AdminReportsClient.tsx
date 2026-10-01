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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-1.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
        <div
          role="tablist"
          aria-label="Reports view toggle"
          className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200/70 shadow-2xs"
        >
          <button
            type="button"
            role="tab"
            id="admin-reports-toggle-financial"
            aria-selected={activeView === 'financial'}
            aria-controls="admin-reports-financial-panel"
            onClick={() => handleViewChange('financial')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'financial'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CircleDollarSign size={14} className={activeView === 'financial' ? 'text-white' : 'text-slate-500'} />
            <span>Financial Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            id="admin-reports-toggle-staff"
            aria-selected={activeView === 'staff'}
            aria-controls="admin-reports-staff-panel"
            onClick={() => handleViewChange('staff')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'staff'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap size={14} className={activeView === 'staff' ? 'text-white' : 'text-slate-500'} />
            <span>Staff & Academic Data</span>
            {lowAttendanceCount > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeView === 'staff' ? 'bg-indigo-700 text-indigo-100' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {lowAttendanceCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-500 px-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
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
