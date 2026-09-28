import { ReactNode } from 'react'

interface TableHeadProps {
  className?: string
  children: ReactNode
}

export function TableHead({ className = '', children }: TableHeadProps) {
  return (
    <th
      className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  )
}