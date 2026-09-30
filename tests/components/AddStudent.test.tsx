// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { AddStudent } from '@/modules/students/components/AddStudent'

afterEach(cleanup)

describe('AddStudent', () => {
  it('shows validation and submits a valid new student', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<AddStudent onClose={vi.fn()} onSave={onSave} />)
    expect(screen.getByLabelText(/Student Name/)).toBeRequired()
    expect(screen.getByLabelText(/Mobile Number/)).toBeRequired()
    await user.type(screen.getByLabelText(/Student Name/), 'Asha Kumar')
    await user.type(screen.getByLabelText(/Mobile Number/), '9876543210')
    await user.type(screen.getByLabelText(/Tuition Fee/), '25000')
    await user.click(screen.getByRole('button', { name: 'Register Student' }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Asha Kumar', phone: '9876543210', total: 25000 }),
    )
  })
})
