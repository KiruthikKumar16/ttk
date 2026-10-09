'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, History, Activity } from 'lucide-react'
import type { AuditEntry } from '@/modules/audit/service'
import { Tag } from '@/components/ui/Tag'
import { Card } from '@/components/ui/Card'
import { PillButton } from '@/components/ui/PillButton'

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
    if (fields.length === 0) return <span className="text-xs text-[var(--mute)]">No field data recorded</span>
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {fields.map(([key, val]) => (
          <div key={key} className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs">
            <span className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider block mb-0.5">
              {prettyFieldName(key)}
            </span>
            <span className="font-medium text-[var(--ink)] break-all">{prettyValue(val)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (action === 'delete' && oldValues) {
    const fields = Object.entries(oldValues).filter(([k]) => !HIDDEN_FIELDS.has(k))
    if (fields.length === 0) return <span className="text-xs text-[var(--mute)]">No field data recorded</span>
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {fields.map(([key, val]) => (
          <div key={key} className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs">
            <span className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider block mb-0.5">
              {prettyFieldName(key)}
            </span>
            <span className="font-medium text-[var(--ink)] line-through opacity-70 break-all">{prettyValue(val)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (action === 'update' && oldValues && newValues) {
    const changedFields = Object.keys(newValues).filter(
      (key) => !HIDDEN_FIELDS.has(key) && String(oldValues[key]) !== String(newValues[key]),
    )
    if (changedFields.length === 0) return <span className="text-xs text-[var(--mute)]">No visible field changes</span>
    return (
      <div className="space-y-2">
        {changedFields.map((key) => (
          <div
            key={key}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs"
          >
            <span className="font-semibold text-[var(--ink)] min-w-[140px]">{prettyFieldName(key)}</span>
            <div className="flex items-center gap-2 flex-1 break-all">
              <span className="px-2 py-0.5 rounded-lg bg-[var(--panel)] text-[var(--mute)] border border-[var(--border)] line-through font-mono text-[11px]">
                {prettyValue(oldValues[key])}
              </span>
              <span className="text-[var(--mute)]">→</span>
              <span className="px-2 py-0.5 rounded-lg bg-[var(--g4)] text-[var(--g1)] border border-[var(--g5)] font-semibold font-mono text-[11px]">
                {prettyValue(newValues[key])}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <span className="text-xs text-[var(--mute)]">No detailed changes available</span>
}

/* ── Row with expandable detail ── */

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = Boolean(entry.oldValues || entry.newValues)

  const actionTagVariant = entry.action === 'insert' ? 'success' : entry.action === 'delete' ? 'danger' : 'accent'

  return (
    <>
      <tr
        className={`transition-colors border-b border-[var(--border)] ${
          hasDetail ? 'cursor-pointer hover:bg-[var(--panel)]' : ''
        }`}
        onClick={() => hasDetail && setExpanded((prev) => !prev)}
      >
        <td className="py-3.5 px-5 text-xs text-[var(--mute)] font-mono">{formatDateTime(entry.changedAt)}</td>
        <td className="py-3.5 px-5">
          <span className="text-xs font-semibold text-[var(--ink)] font-mono bg-[var(--panel)] px-2 py-1 rounded-md border border-[var(--border)]">
            {entry.tableName}
          </span>
        </td>
        <td className="py-3.5 px-5">
          <Tag variant={actionTagVariant}>{actionLabel(entry.action)}</Tag>
        </td>
        <td className="py-3.5 px-5 font-mono text-xs text-[var(--mute)]">{entry.recordId.slice(0, 8)}…</td>
        <td className="py-3.5 px-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--ink)]">{entry.actor}</span>
            {entry.actorRole && (
              <span className="text-[10px] font-medium text-[var(--mute)] uppercase px-1.5 py-0.5 bg-[var(--panel)] rounded">
                {entry.actorRole}
              </span>
            )}
          </div>
        </td>
        <td className="py-3.5 px-5 text-right">
          {hasDetail && (
            <button
              type="button"
              className="p-1 rounded-full text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--panel)] transition-colors"
              aria-label={expanded ? 'Collapse changes' : 'Expand changes'}
              onClick={(e) => {
                e.stopPropagation()
                setExpanded((prev) => !prev)
              }}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[var(--panel)] border-b border-[var(--border)]">
          <td colSpan={6} className="p-4">
            <div className="rounded-[18px] bg-[var(--bg)] p-4 border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">
                  Audit Snapshot Details
                </span>
                <span className="text-[11px] font-mono text-[var(--mute)]">ID: #{entry.id}</span>
              </div>
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
    <div className="space-y-6">
      {/* Page Heading & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Tag variant="accent">SYSTEM ACTIVITY</Tag>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">Audit Log</h1>
          <p className="text-xs text-[var(--mute)] mt-1">
            Review changes to student, payment, and course records with granular field audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tag variant="neutral">
            <Activity size={12} className="inline mr-1" />
            {entries.length} Entries Logged
          </Tag>
        </div>
      </div>

      {/* Filter Bar Panel */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search record ID, table, or action…"
                className="w-full pl-9 pr-8 py-2 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors placeholder:text-[var(--mute)]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)]"
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
                className="w-full px-3.5 py-2 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors placeholder:text-[var(--mute)]"
              />
              {userFilter && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearUserSearch()
                    setShowSuggestions(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)]"
                  aria-label="Clear user search"
                >
                  <X size={14} />
                </button>
              )}
              {/* Autocomplete Dropdown */}
              {showSuggestions && userSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                  <ul className="py-1">
                    {userSuggestions.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 text-xs text-[var(--ink)] hover:bg-[var(--panel)] focus:bg-[var(--panel)] focus:outline-none font-medium"
                          onMouseDown={(e) => {
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
                className="w-full px-3 py-2 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors cursor-pointer font-medium"
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
                className="w-full px-3 py-2 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors cursor-pointer font-medium"
              >
                <option value="">All Actions</option>
                <option value="insert">Created</option>
                <option value="update">Updated</option>
                <option value="delete">Deleted</option>
              </select>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <PillButton variant="secondary" size="sm" icon={<X size={13} />} onClick={handleClearAll}>
                Reset
              </PillButton>
            )}
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--panel)] border-b border-[var(--border)] text-[var(--mute)] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Table</th>
                <th className="py-3 px-5">Action</th>
                <th className="py-3 px-5">Record ID</th>
                <th className="py-3 px-5">Changed By</th>
                <th className="py-3 px-5 text-right" style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-[var(--mute)]">
                    {hasActiveFilters ? 'No audit records match your current filters.' : 'No audit records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-[var(--border)] bg-[var(--panel)] text-xs text-[var(--mute)]">
          <div className="font-medium">Cursor page {page}</div>
          <div className="flex items-center gap-2">
            <a
              href={
                cursor && previousCursor
                  ? buildHref({ page: Math.max(1, page - 1), cursor: previousCursor })
                  : buildHref({ page: 1 })
              }
              aria-disabled={!cursor}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] font-medium transition-colors ${
                !cursor
                  ? 'pointer-events-none opacity-40 bg-[var(--panel)] text-[var(--mute)]'
                  : 'hover:bg-[var(--card)] text-[var(--ink)]'
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
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] font-medium transition-colors ${
                !hasNextPage
                  ? 'pointer-events-none opacity-40 bg-[var(--panel)] text-[var(--mute)]'
                  : 'hover:bg-[var(--card)] text-[var(--ink)]'
              }`}
            >
              Next
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
