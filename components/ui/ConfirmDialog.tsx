import { useEffect } from 'react'
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
  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
            <h2 className="text-lg font-semibold leading-tight">{title}</h2>
            {description && (
              <p className="mt-2 text-muted-foreground">{description}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              size="default"
              onClick={onCancel}
            >
              {cancelText}
            </Button>
            <Button
              variant={destructive ? 'destructive' : 'default'}
              size="default"
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}