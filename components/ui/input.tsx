import type { HTMLAttributes } from 'react'

interface InputProps {
  id?: string
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  min?: number
  max?: number
  step?: string
}

export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  required = false,
  rows,
  min,
  max,
  step,
  id,
  inputMode,
}: InputProps) {
  if (rows && rows > 1) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
        disabled={disabled}
        required={required}
        rows={rows}
      />
    )
  }

  return (
    <input
      type={type}
      id={id}
      inputMode={inputMode}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
      disabled={disabled}
      required={required}
      min={min}
      max={max}
      step={step}
    />
  )
}
