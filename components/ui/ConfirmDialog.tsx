'use client'

import { useEffect, useRef } from 'react'
import { Button } from './button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    if (!isOpen) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )
    focusable()[0]?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancelRef.current()
        return
      }
      if (e.key === 'Tab') {
        const items = focusable()
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      data-testid="confirm-dialog-overlay"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-description' : undefined}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
        tabIndex={-1}
      >
        <div className="relative bg-card text-card-foreground shadow-lg rounded-lg border p-6">
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute right-3 top-3 rounded-sm hover:bg-muted p-1 text-muted-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="pt-2">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold leading-tight">
              {title}
            </h2>
            {description && (
              <p id="confirm-dialog-description" className="mt-2 text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" size="default" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button variant={destructive ? 'destructive' : 'default'} size="default" onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
