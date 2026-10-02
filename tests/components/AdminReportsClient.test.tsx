// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { AdminReportsClient } from '@/modules/reports/components/AdminReportsClient'
import type { AcademicReportData } from '@/modules/reports/service'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const mockAcademicData: AcademicReportData = {
  attendanceRecords: [
    {
      id: 'att-1',
      sessionDate: '2026-09-15',
      status: 'Absent',
      studentId: 'st-1',
      studentName: 'Alice Johnson',
      studentRegisterId: 101,
      courseId: 'c-1',
      courseName: 'UI/UX Design',
    },
    {
      id: 'att-2',
      sessionDate: '2026-09-16',
      status: 'Absent',
      studentId: 'st-1',
      studentName: 'Alice Johnson',
      studentRegisterId: 101,
      courseId: 'c-1',
      courseName: 'UI/UX Design',
    },
  ],
  assessmentRecords: [],
}

describe('AdminReportsClient', () => {
  it('renders both toggle tabs and defaults to financial view', () => {
    render(
      <AdminReportsClient students={[]} payments={[]} academicData={mockAcademicData} categories={[]} courses={[]} />,
    )

    const financialTab = screen.getByRole('tab', { name: /financial overview/i })
    const staffTab = screen.getByRole('tab', { name: /staff & academic data/i })

    expect(financialTab).toBeInTheDocument()
    expect(staffTab).toBeInTheDocument()
    expect(financialTab).toHaveAttribute('aria-selected', 'true')
    expect(staffTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tabpanel', { name: /financial overview/i })).toBeInTheDocument()
  })

  it('switches to staff view on click and persists in localStorage', async () => {
    const user = userEvent.setup()
    render(
      <AdminReportsClient students={[]} payments={[]} academicData={mockAcademicData} categories={[]} courses={[]} />,
    )

    const staffTab = screen.getByRole('tab', { name: /staff & academic data/i })
    await user.click(staffTab)

    expect(staffTab).toHaveAttribute('aria-selected', 'true')
    expect(localStorage.getItem('admin_reports_active_view')).toBe('staff')
    expect(screen.getByRole('tabpanel', { name: /staff & academic data/i })).toBeInTheDocument()
  })

  it('restores staff view preference from localStorage', () => {
    localStorage.setItem('admin_reports_active_view', 'staff')

    render(
      <AdminReportsClient students={[]} payments={[]} academicData={mockAcademicData} categories={[]} courses={[]} />,
    )

    const staffTab = screen.getByRole('tab', { name: /staff & academic data/i })
    expect(staffTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: /staff & academic data/i })).toBeInTheDocument()
  })
})
