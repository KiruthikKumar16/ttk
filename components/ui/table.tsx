import { ReactNode } from 'react'

interface TableProps {
  className?: string
  children: ReactNode
}

export function Table({ className = '', children }: TableProps) {
  return <table className={`min-w-full divide-y divide-gray-200 ${className}`}>{children}</table>
}
