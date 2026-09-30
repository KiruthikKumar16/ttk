// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

afterEach(cleanup)

describe('ConfirmDialog', () => {
  it('announces confirmation and returns focus to its opener after cancel', async () => {
    const user = userEvent.setup()
    const cancel = vi.fn()
    const confirm = vi.fn()
    render(
      <>
        <button>Open</button>
        <ConfirmDialog
          isOpen
          onConfirm={confirm}
          onCancel={cancel}
          title="Delete student"
          description="This cannot be undone."
        />
      </>,
    )
    const dialog = screen.getByRole('alertdialog', { name: 'Delete student' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
    await user.keyboard('{Escape}')
    expect(cancel).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(confirm).toHaveBeenCalledOnce()
  })

  it('traps tab focus inside the dialog and restores focus when it closes', async () => {
    const user = userEvent.setup()
    const Harness = () => {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>Open delete dialog</button>
          {open && (
            <ConfirmDialog isOpen onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)} title="Delete" />
          )}
        </>
      )
    }
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open delete dialog' })
    await user.click(opener)
    const close = screen.getByRole('button', { name: 'Close' })
    const confirm = screen.getByRole('button', { name: 'Confirm' })
    confirm.focus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(confirm).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(opener).toHaveFocus())
  })
})
