'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import type { AuditEntry } from '@/modules/audit/service'

/* ── Helpers ── */

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return iso
  }
}

function actionLabel(action: string): string {
  switch (action) {
    case 'insert':
      return 'Created'
    case 'update':
      return 'Updated'
    case 'delete':
      return 'Deleted'
    default:
      return action
  }
}

function prettyFieldName(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function prettyValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/** Fields that are noisy / internal and should be collapsed by default */
const HIDDEN_FIELDS = new Set(['id', 'created_at', 'updated_at', 'changed_at', 'changed_by'])

/* ── Inline diff component ── */

function ChangeDiff({
  action,
  oldValues,
  newValues,
}: {
  action: AuditEntry['action']
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
}) {
  if (action === 'insert' && newValues) {
    const fields = Object.entries(newValues).filter(([k]) => !HIDDEN_FIELDS.has(k))
    if (fields.length === 0) return <span className="audit-no-changes">No field data recorded</span>
    return (
      <div className="audit-diff-list">
        {fields.map(([key, val]) => (
          <div key={key} className="audit-diff-row">
            <span className="audit-diff-field">{prettyFieldName(key)}</span>
            <span className="audit-diff-new">{prettyValue(val)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (action === 'delete' && oldValues) {
    const fields = Object.entries(oldValues).filter(([k]) => !HIDDEN_FIELDS.has(k))
    if (fields.length === 0) return <span className="audit-no-changes">No field data recorded</span>
    return (
      <div className="audit-diff-list">
        {fields.map(([key, val]) => (
          <div key={key} className="audit-diff-row">
            <span className="audit-diff-field">{prettyFieldName(key)}</span>
            <span className="audit-diff-old">{prettyValue(val)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (action === 'update' && oldValues && newValues) {
    const changedFields = Object.keys(newValues).filter(
      (key) => !HIDDEN_FIELDS.has(key) && String(oldValues[key]) !== String(newValues[key]),
    )
    if (changedFields.length === 0) return <span className="audit-no-changes">No visible field changes</span>
    return (
      <div className="audit-diff-list">
        {changedFields.map((key) => (
          <div key={key} className="audit-diff-row">
            <span className="audit-diff-field">{prettyFieldName(key)}</span>
            <span className="audit-diff-old">{prettyValue(oldValues[key])}</span>
            <span className="audit-diff-arrow">→</span>
            <span className="audit-diff-new">{prettyValue(newValues[key])}</span>
          </div>
        ))}
      </div>
    )
  }

  return <span className="audit-no-changes">No detailed changes available</span>
}

/* ── Row with expandable detail ── */

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = Boolean(entry.oldValues || entry.newValues)

  return (
    <>
      <tr className={hasDetail ? 'clickable-row' : ''} onClick={() => hasDetail && setExpanded((prev) => !prev)}>
        <td className="audit-timestamp">{formatDateTime(entry.changedAt)}</td>
        <td>
          <span className="audit-table-name">{entry.tableName}</span>
        </td>
        <td>
          <span className={`audit-action audit-action-${entry.action}`}>{actionLabel(entry.action)}</span>
        </td>
        <td className="mono">{entry.recordId.slice(0, 8)}…</td>
        <td>
          <div className="audit-actor">
            <span className="audit-actor-name">{entry.actor}</span>
            {entry.actorRole && <span className="audit-actor-role">{entry.actorRole}</span>}
          </div>
        </td>
        <td className="audit-expand-cell">
          {hasDetail && (
            <button
              type="button"
              className="audit-expand-btn"
              aria-label={expanded ? 'Collapse changes' : 'Expand changes'}
              onClick={(e) => {
                e.stopPropagation()
                setExpanded((prev) => !prev)
              }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="audit-detail-row">
          <td colSpan={6}>
            <div className="audit-detail-panel">
              <ChangeDiff action={entry.action} oldValues={entry.oldValues} newValues={entry.newValues} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ── Main view ── */

export function AuditLogView({
  entries,
  page,
  pageSize,
  search: initialSearch,
  tableName: initialTableName,
  action: initialAction,
  userName: initialUserName,
  hasNextPage,
  nextCursor,
  cursor,
  previousCursor,
}: {
  entries: AuditEntry[]
  page: number
  pageSize: number
  search: string
  tableName: string
  action: string
  userName: string
  hasNextPage: boolean
  nextCursor: string | null
  cursor?: string
  previousCursor?: string
}) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [tableFilter, setTableFilter] = useState(initialTableName)
  const [actionFilter, setActionFilter] = useState(initialAction)
  const [userFilter, setUserFilter] = useState(initialUserName)

  // Autocomplete state
  const [userSuggestions, setUserSuggestions] = useState<{ id: string; full_name: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const userSearchRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Close suggestions if clicked outside
    const handleClickOutside = (e: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Debounced fetch for user autocomplete
    const handler = setTimeout(() => {
      if (!userFilter || userFilter === initialUserName) {
        setUserSuggestions([])
        return
      }
      fetch(`/api/admin/users/search?q=${encodeURIComponent(userFilter)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Search failed')
          return res.json()
        })
        .then((data) => setUserSuggestions(data))
        .catch(() => setUserSuggestions([]))
    }, 300)

    return () => clearTimeout(handler)
  }, [userFilter, initialUserName])

  const buildHref = (overrides: {
    search?: string
    tableName?: string
    action?: string
    userName?: string
    page?: number
    cursor?: string
    previousCursor?: string
  }) => {
    const params = new URLSearchParams()
    const s = overrides.search ?? searchTerm
    const t = overrides.tableName ?? tableFilter
    const a = overrides.action ?? actionFilter
    const u = overrides.userName ?? userFilter

    if (s) params.set('search', s.trim())
    if (t) params.set('tableName', t)
    if (a) params.set('action', a)
    if (u) params.set('userName', u.trim())
    params.set('page', String(overrides.page ?? 1))
    params.set('pageSize', String(pageSize))
    if (overrides.cursor) params.set('cursor', overrides.cursor)
    if (overrides.previousCursor) params.set('previousCursor', overrides.previousCursor)
    return `/audit-log?${params.toString()}`
  }

  const applyFilters = (overrides: { search?: string; tableName?: string; action?: string; userName?: string }) => {
    router.push(buildHref({ ...overrides, page: 1 }))
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters({ search: searchTerm })
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    applyFilters({ search: '' })
  }

  const handleTableChange = (value: string) => {
    setTableFilter(value)
    applyFilters({ tableName: value })
  }

  const handleActionChange = (value: string) => {
    setActionFilter(value)
    applyFilters({ action: value })
  }

  const handleUserSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters({ userName: userFilter })
  }

  const handleClearUserSearch = () => {
    setUserFilter('')
    applyFilters({ userName: '' })
  }

  const handleClearAll = () => {
    setSearchTerm('')
    setTableFilter('')
    setActionFilter('')
    setUserFilter('')
    router.push(`/audit-log?page=1&pageSize=${pageSize}`)
  }

  const hasActiveFilters = Boolean(searchTerm || tableFilter || actionFilter || userFilter)

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SYSTEM ACTIVITY</p>
          <h1>Audit Log</h1>
          <p className="subcopy">Review changes to student, payment, and course records.</p>
        </div>
      </div>

      <section className="panel">
        {/* ── Filter bar ── */}
        <div className="panel-header flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search record ID, table, or action…"
                className="w-full pl-9 pr-8 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* User Search */}
            <form
              onSubmit={handleUserSearchSubmit}
              className="relative flex-1 min-w-[150px] max-w-[200px]"
              ref={userSearchRef}
            >
              <input
                type="text"
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => {
                  if (userFilter) setShowSuggestions(true)
                }}
                placeholder="Filter by user name…"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white"
              />
              {userFilter && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearUserSearch()
                    setShowSuggestions(false)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear user search"
                >
                  <X size={14} />
                </button>
              )}
              {/* Autocomplete Dropdown */}
              {showSuggestions && userSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                  <ul className="py-1">
                    {userSuggestions.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                          onMouseDown={(e) => {
                            // Prevent input blur before click registers
                            e.preventDefault()
                          }}
                          onClick={() => {
                            setUserFilter(user.full_name)
                            setShowSuggestions(false)
                            applyFilters({ userName: user.full_name })
                          }}
                        >
                          {user.full_name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>

            {/* Table filter */}
            <div className="min-w-[140px]">
              <label htmlFor="audit-table-filter" className="sr-only">
                Table
              </label>
              <select
                id="audit-table-filter"
                value={tableFilter}
                onChange={(e) => handleTableChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
              >
                <option value="">All Tables</option>
                <option value="assessments">Assessments</option>
                <option value="attendance">Attendance</option>
                <option value="brand_settings">Brand Settings</option>
                <option value="course_categories">Course Categories</option>
                <option value="course_materials">Course Materials</option>
                <option value="courses">Courses</option>
                <option value="invite_codes">Invite Codes</option>
                <option value="notifications">Notifications</option>
                <option value="payments">Payments (Invoices)</option>
                <option value="profiles">Profiles (Users)</option>
                <option value="skill_tags">Skill Tags</option>
                <option value="students">Students</option>
                <option value="verifiable_documents">Verifiable Documents (Certificates)</option>
              </select>
            </div>

            {/* Action filter */}
            <div className="min-w-[130px]">
              <label htmlFor="audit-action-filter" className="sr-only">
                Action
              </label>
              <select
                id="audit-action-filter"
                value={actionFilter}
                onChange={(e) => handleActionChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
              >
                <option value="">All Actions</option>
                <option value="insert">Created</option>
                <option value="update">Updated</option>
                <option value="delete">Deleted</option>
              </select>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-xs text-slate-500 whitespace-nowrap">
              Showing <strong className="text-slate-800">{entries.length}</strong> entries
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="data-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Table</th>
                <th>Action</th>
                <th>Record ID</th>
                <th>Changed By</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm" style={{ color: 'var(--muted)' }}>
                    {hasActiveFilters ? 'No audit records match your current filters.' : 'No audit records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
          <div className="table-summary border-0 p-0">Cursor page {page}</div>
          <div className="flex items-center gap-2">
            <a
              href={
                cursor && previousCursor
                  ? buildHref({ page: Math.max(1, page - 1), cursor: previousCursor })
                  : buildHref({ page: 1 })
              }
              aria-disabled={!cursor}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium transition-colors ${
                !cursor
                  ? 'pointer-events-none opacity-40 text-slate-400'
                  : 'text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <ChevronLeft size={14} />
              Previous
            </a>
            <a
              href={
                hasNextPage && nextCursor
                  ? buildHref({ page: page + 1, cursor: nextCursor, previousCursor: cursor })
                  : '#'
              }
              aria-disabled={!hasNextPage}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium transition-colors ${
                !hasNextPage
                  ? 'pointer-events-none opacity-40 text-slate-400'
                  : 'text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              Next
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
