import { ReactNode } from 'react'

interface TableRowProps {
  className?: string
  children: ReactNode
  onClick?: () => void
}

export function TableRow({ className = '', children, onClick }: TableRowProps) {
  return (
    <tr className={`border-t ${className}`} onClick={onClick}>
      {children}
    </tr>
  )
}
