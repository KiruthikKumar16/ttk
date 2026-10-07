import { useState } from 'react'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  children: React.ReactNode
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

interface SelectContentProps {
  className?: string
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function Select({
  value,
  onValueChange,
  placeholder = '',
  className = '',
  disabled = false,
  children,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <SelectTrigger
        className={`border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 w-full ${isOpen ? 'border-b-0 border-b-gray-100' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <SelectValue>{placeholder}</SelectValue>
      </SelectTrigger>
      {isOpen && (
        <SelectContent
          className={`absolute left-0 right-0 mt-2 border border-gray-300 rounded-md bg-white shadow-lg z-20 max-h-60 overflow-y-auto`}
        >
          {children}
        </SelectContent>
      )}
    </div>
  )
}

export function SelectTrigger({ children, className = '', onClick, disabled = false }: SelectTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between px-2 py-2 cursor-pointer text-sm text-gray-700 ${className}`}
    >
      {children}
    </button>
  )
}

export function SelectValue({ children, placeholder }: { children?: React.ReactNode; placeholder?: string }) {
  return <span className="text-slate-800 font-medium">{children ?? placeholder}</span>
}

export function SelectContent({ className = '', children }: SelectContentProps) {
  return <div className={className}>{children}</div>
}

export function SelectItem({ value, children, className = '', disabled = false }: SelectItemProps) {
  const isSelected = value === ''
  // In a real implementation, we'd compare with the selected value from context/props
  // For now, we'll just highlight the first item as selected for demo purposes

  return (
    <div
      className={`px-2 py-2 cursor-pointer text-sm hover:bg-gray-100 ${isSelected ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => {
        if (!disabled) {
          // In a real implementation, we'd call onValueChange with the actual value
          // For now, we'll just close the select
        }
      }}
    >
      {children}
    </div>
  )
}
