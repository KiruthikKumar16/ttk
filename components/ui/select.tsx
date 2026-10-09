'use client'

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  disabled?: boolean
  selectedLabel: string | null
  registerItem: (value: string, label: string) => void
}

const SelectContext = createContext<SelectContextType | null>(null)

function useSelectContext() {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error('Select compound components must be used within a Select provider')
  }
  return context
}

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  children: React.ReactNode
}

export function Select({
  value = '',
  onValueChange,
  className = '',
  disabled = false,
  children,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [itemsMap, setItemsMap] = useState<Record<string, string>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const registerItem = useCallback((itemValue: string, itemLabel: string) => {
    setItemsMap((prev) => {
      if (prev[itemValue] === itemLabel) return prev
      return { ...prev, [itemValue]: itemLabel }
    })
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const selectedLabel = itemsMap[value] ?? null

  const handleValueChange = (newVal: string) => {
    onValueChange?.(newVal)
  }

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        isOpen,
        setIsOpen,
        disabled,
        selectedLabel,
        registerItem,
      }}
    >
      <div ref={containerRef} className={cn('relative w-full', className)}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export function SelectTrigger({ children, className = '', disabled, ...props }: SelectTriggerProps) {
  const context = useSelectContext()
  const isDisabled = disabled ?? context.disabled

  return (
    <button
      type="button"
      onClick={() => {
        if (!isDisabled) {
          context.setIsOpen((prev) => !prev)
        }
      }}
      disabled={isDisabled}
      aria-expanded={context.isOpen}
      className={cn(
        'flex w-full items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 transition-all cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--g1)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs',
        className
      )}
      {...props}
    >
      <div className="flex-1 text-left truncate">{children}</div>
      <ChevronDown
        size={16}
        className={cn('text-slate-400 transition-transform duration-200 shrink-0 ml-1', context.isOpen && 'rotate-180')}
      />
    </button>
  )
}

export function SelectValue({
  children,
  placeholder = 'Select...',
  className = '',
}: {
  children?: React.ReactNode
  placeholder?: string
  className?: string
}) {
  const context = useSelectContext()
  const hasValue = context.value !== '' && context.value !== undefined && context.value !== null
  const display = hasValue ? (context.selectedLabel || context.value) : null

  return (
    <span
      className={cn(
        'block truncate text-left',
        display ? 'text-slate-800 font-medium' : 'text-slate-400 font-normal',
        className
      )}
    >
      {display ?? children ?? placeholder}
    </span>
  )
}

export interface SelectContentProps {
  className?: string
  children: React.ReactNode
}

export function SelectContent({ className = '', children }: SelectContentProps) {
  const { isOpen } = useSelectContext()

  return (
    <div
      role="listbox"
      aria-hidden={!isOpen}
      className={cn(
        'absolute left-0 right-0 top-full mt-1.5 z-50 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg backdrop-blur-md',
        !isOpen && 'hidden',
        className
      )}
    >
      {children}
    </div>
  )
}

export interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function SelectItem({ value, children, className = '', disabled = false }: SelectItemProps) {
  const context = useSelectContext()
  const isSelected = context.value === value

  // Register label into context
  useEffect(() => {
    let label = ''
    if (typeof children === 'string' || typeof children === 'number') {
      label = String(children)
    } else if (React.isValidElement(children)) {
      const childProps = (children as any).props
      if (childProps && typeof childProps.children === 'string') {
        label = childProps.children
      }
    }
    if (label) {
      context.registerItem(value, label)
    }
  }, [value, children, context])

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2 text-xs font-medium outline-none transition-colors',
        isSelected
          ? 'bg-[var(--g4)] text-[var(--g1)] font-semibold'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) {
          context.onValueChange(value)
          context.setIsOpen(false)
        }
      }}
    >
      <span className="truncate">{children}</span>
      {isSelected && <Check size={14} className="text-[var(--g1)] shrink-0 ml-2" />}
    </div>
  )
}
