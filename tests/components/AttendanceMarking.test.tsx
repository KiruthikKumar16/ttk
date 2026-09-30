// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
import { AttendanceMarking } from '@/modules/attendance/components/AttendanceMarking'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('AttendanceMarking', () => {
  it('supports arrow-key status changes and reports autosave', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(
      <AttendanceMarking
        courseId="CRS-01"
        sessionDate="2026-09-29"
        roster={[{ registerId: 42, name: 'Asha', status: null }]}
      />,
    )
    const present = screen.getByRole('button', { name: 'Present for Asha' })
    present.focus()
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ studentId: 42, status: 'Absent' })
    expect(screen.getByRole('status')).toHaveTextContent('Attendance saved for Asha.')
  })

  it('marks the full roster present and reports a failed autosave', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(
      <AttendanceMarking
        courseId="CRS-01"
        sessionDate="2026-09-29"
        roster={[
          { registerId: 42, name: 'Asha', status: null },
          { registerId: 43, name: 'Bala', status: null },
        ]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Mark all present' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const statuses = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body).status)
    expect(statuses).toEqual(['Present', 'Present'])

    fetchMock.mockRejectedValueOnce(new Error('offline'))
    await user.click(screen.getByRole('button', { name: 'Absent for Asha' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('offline'))
    expect(screen.getByRole('button', { name: 'Present for Asha' })).toHaveAttribute('aria-pressed', 'true')
  })
})
