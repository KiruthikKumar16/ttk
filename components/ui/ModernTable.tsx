'use client'

import React, { useState, type ReactNode } from 'react'

export interface ColumnDef {
  header: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface TableRowItem {
  id?: string | number
  cells: ReactNode[]
  onClick?: () => void
  title?: string
  className?: string
}

export type TableRowType = TableRowItem | ReactNode[]

export interface ModernTableProps {
  columns: (string | ColumnDef)[]
  rows?: TableRowType[]
  children?: ReactNode
  emptyMessage?: string
  className?: string
}

export function ModernTable({
  columns,
  rows,
  children,
  emptyMessage = 'No records found.',
  className = '',
}: ModernTableProps) {
  const [hoverRow, setHoverRow] = useState<number>(-1)

  const normalizedCols: ColumnDef[] = columns.map((col) =>
    typeof col === 'string' ? { header: col, align: 'left' } : col
  )

  return (
    <div
      className={`w-full max-w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs transition-colors duration-200 ${className}`}
      style={{
        borderRadius: '12px',
        border: '1px solid var(--border)',
      }}
    >
      <table className="w-full max-w-full border-collapse font-[var(--font-jakarta)] table-auto">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--hover-bg)]/30">
            {normalizedCols.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={`py-2.5 px-3.5 text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider transition-colors duration-150 ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                } ${col.className || ''}`}
                style={{
                  letterSpacing: '0.05em',
                  padding: '10px 14px',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows ? (
            rows.length > 0 ? (
              rows.map((rowItem, ri) => {
                const isArrayRow = Array.isArray(rowItem)
                const cells = isArrayRow ? rowItem : rowItem.cells
                const rowId = isArrayRow ? ri : (rowItem.id ?? ri)
                const onClick = isArrayRow ? undefined : rowItem.onClick
                const title = isArrayRow ? undefined : rowItem.title
                const customClassName = isArrayRow ? '' : (rowItem.className || '')

                const isHovered = hoverRow === ri

                return (
                  <tr
                    key={rowId}
                    onClick={onClick}
                    onMouseEnter={() => setHoverRow(ri)}
                    onMouseLeave={() => setHoverRow(-1)}
                    className={`transition-all duration-150 ${
                      onClick ? 'cursor-pointer' : ''
                    } ${ri < rows.length - 1 ? 'border-b border-[var(--border)]' : ''} ${customClassName}`}
                    style={{
                      backgroundColor: isHovered ? 'var(--g4)' : 'transparent',
                      boxShadow: isHovered
                        ? 'inset 3.5px 0 0 0 var(--g1), inset 0 0 0 1px var(--g1)'
                        : 'none',
                    }}
                    title={title}
                  >
                    {cells.map((cell, ci) => {
                      const col = normalizedCols[ci]
                      const alignClass =
                        col?.align === 'right'
                          ? 'text-right'
                          : col?.align === 'center'
                            ? 'text-center'
                            : 'text-left'

                      return (
                        <td
                          key={ci}
                          className={`py-3 px-3.5 text-sm text-[var(--text)] transition-colors duration-150 ${alignClass} ${col?.className || ''}`}
                          style={{
                            padding: '10px 14px',
                          }}
                        >
                          {cell}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={normalizedCols.length}
                  className="py-8 text-center text-xs text-[var(--mute)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ModernTable
