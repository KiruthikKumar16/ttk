import type { TdHTMLAttributes } from 'react'

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>

export function TableCell({ className = '', children, ...props }: TableCellProps) {
  return (
    <td
      className={`px-4 py-2 text-sm text-gray-700 ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}
