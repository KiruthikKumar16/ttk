'use client'

import { useEffect, useRef } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { AlertCircle, AlertTriangle, X } from 'lucide-react'
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      data-testid="confirm-dialog-overlay"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-description' : undefined}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto"
        tabIndex={-1}
      >
        <div className="relative bg-white dark:bg-[#151d2f] text-[var(--ink)] shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7">
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3.5 pr-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[var(--g5)] text-[var(--g1)]"
              style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
            >
              {destructive ? <AlertTriangle size={20} /> : <AlertCircle size={20} />}
            </div>

            <div className="flex-1 min-w-0">
              <h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {title}
              </h2>
              {description && (
                <p id="confirm-dialog-description" className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <PillButton type="button" variant="secondary" size="sm" onClick={onCancel}>
              {cancelText}
            </PillButton>
            <PillButton type="button" variant={destructive ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
              {confirmText}
            </PillButton>
          </div>
        </div>
      </div>
    </div>
  )
}
