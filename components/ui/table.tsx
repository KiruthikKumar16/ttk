'use client'

import React, { ReactNode } from 'react'
import { ModernTable, ColumnDef, TableRowType } from './ModernTable'

export interface TableProps {
  columns?: (string | ColumnDef)[]
  rows?: TableRowType[]
  className?: string
  children?: ReactNode
  emptyMessage?: string
}

export function Table({
  columns,
  rows,
  className = '',
  children,
  emptyMessage = 'No records found.',
}: TableProps) {
  if (columns) {
    return (
      <ModernTable
        columns={columns}
        rows={rows}
        className={className}
        emptyMessage={emptyMessage}
      >
        {children}
      </ModernTable>
    )
  }

  return <table className={`min-w-full divide-y divide-gray-200 ${className}`}>{children}</table>
}

export default Table
