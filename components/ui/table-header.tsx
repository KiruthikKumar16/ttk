import { ReactNode } from 'react'

interface TableHeaderProps {
  className?: string
  children: ReactNode
}

export function TableHeader({ className = '', children }: TableHeaderProps) {
  return (
    <thead className={`bg-gray-50 ${className}`}>
      <tr>{children}</tr>
    </thead>
  )
}