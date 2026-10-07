'use client'

import React from 'react'
import { FileText, Download, Eye, Trash2, FileSpreadsheet, FileCode, Film, Archive } from 'lucide-react'
import { PillButton } from '@/components/ui/PillButton'
import { Tag } from '@/components/ui/Tag'

export interface FileCardProps {
  title: string
  fileType?: string // e.g. 'pdf', 'slides', 'image', 'doc', 'archive'
  fileSize?: string
  uploadedAt?: string
  category?: string
  onView?: () => void
  onDownload?: () => void
  onDelete?: () => void
  canDelete?: boolean
  className?: string
}

export function FileCard({
  title,
  fileType = 'doc',
  fileSize,
  uploadedAt,
  category,
  onView,
  onDownload,
  onDelete,
  canDelete = false,
  className = '',
}: FileCardProps) {
  const normalizedType = fileType.toLowerCase()

  const getIcon = () => {
    if (normalizedType.includes('pdf')) return <FileText size={20} className="text-rose-500" />
    if (normalizedType.includes('sheet') || normalizedType.includes('csv') || normalizedType.includes('xls'))
      return <FileSpreadsheet size={20} className="text-emerald-500" />
    if (normalizedType.includes('slide') || normalizedType.includes('ppt'))
      return <FileText size={20} className="text-amber-500" />
    if (normalizedType.includes('video') || normalizedType.includes('mp4'))
      return <Film size={20} className="text-indigo-500" />
    if (normalizedType.includes('zip') || normalizedType.includes('archive') || normalizedType.includes('tar'))
      return <Archive size={20} className="text-purple-500" />
    return <FileCode size={20} className="text-[var(--g1)]" />
  }

  return (
    <div
      className={`group flex flex-col justify-between rounded-[22px] border border-[var(--card-border)] bg-[var(--card)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--panel)] border border-[var(--border)]">
            {getIcon()}
          </div>
          {category && <Tag variant="neutral" size="sm">{category}</Tag>}
        </div>

        <h4 className="mt-4 text-sm font-bold text-[var(--text-heading)] line-clamp-2 leading-snug group-hover:text-[var(--g1)] transition-colors">
          {title}
        </h4>

        <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--mute)]">
          {fileSize && <span>{fileSize}</span>}
          {fileSize && uploadedAt && <span>·</span>}
          {uploadedAt && <span>{uploadedAt}</span>}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3.5">
        <div className="flex items-center gap-1.5">
          {onView && (
            <button
              type="button"
              onClick={onView}
              title="View file"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--mute)] hover:bg-[var(--hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <Eye size={15} />
            </button>
          )}
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              title="Download file"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--mute)] hover:bg-[var(--hover-bg)] hover:text-[var(--g1)] transition-colors cursor-pointer"
            >
              <Download size={15} />
            </button>
          )}
        </div>

        {canDelete && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="Delete file"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--mute)] hover:bg-rose-50 hover:text-[#b53c37] transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
