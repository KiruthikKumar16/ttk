'use client'

import { useIsFetching } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function LoadingSpinner() {
  const isFetching = useIsFetching()

  return (
    isFetching > 0 && (
      <div
        className={cn(
          'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200',
        )}
      >
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 animate-spin',
          )}
        >
          <Loader2 className={cn('h-6 w-6 text-primary')} />
        </div>
      </div>
    )
  )
}
