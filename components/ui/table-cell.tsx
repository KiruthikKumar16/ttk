import { ReactNode } from 'react'

interface TableCellProps {
  className?: string
  children: ReactNode
  colSpan?: number
}

export function TableCell({ className = '', children, colSpan }: TableCellProps) {
  return (
    <td
      className={`px-4 py-2 text-sm text-gray-700 ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  )
}