'use client'

import { useState } from 'react'
import type { Role } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Save, RotateCcw, Check, AlertCircle, Search, UserCheck, Clock, Shield, Users } from 'lucide-react'

type UserProfile = { id: string; full_name: string | null; role: Role; created_at: string | null }
type FilterTab = 'all' | 'pending' | 'staff' | 'admin'

export function UserRoles({
  users,
  currentUserId,
  initialFilter,
}: {
  users: UserProfile[]
  currentUserId: string
  initialFilter?: string
}) {
  const [initialRows, setInitialRows] = useState<UserProfile[]>(users)
  const [rows, setRows] = useState<UserProfile[]>(users)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>(
    initialFilter && ['pending', 'staff', 'admin'].includes(initialFilter) ? (initialFilter as FilterTab) : 'all',
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // Track pending changes: map of userId -> modified role
  const pendingChanges = rows.reduce<Record<string, Role>>((acc, row) => {
    const original = initialRows.find((init) => init.id === row.id)
    if (original && original.role !== row.role) {
      acc[row.id] = row.role
    }
    return acc
  }, {})

  const changedCount = Object.keys(pendingChanges).length
  const hasChanges = changedCount > 0

  const handleRoleSelect = (userId: string, newRole: Role) => {
    setError('')
    setSuccess('')
    setRows((current) => current.map((row) => (row.id === userId ? { ...row, role: newRole } : row)))
  }

  const handleDiscard = () => {
    setRows(initialRows)
    setError('')
    setSuccess('')
  }

  const handleQuickApprove = async (userId: string, targetRole: Role = 'staff') => {
    setApprovingId(userId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: targetRole }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.error?.message ?? result?.error ?? `Failed to approve user ${userId}.`)
      }

      setRows((current) => current.map((row) => (row.id === userId ? { ...row, role: targetRole } : row)))
      setInitialRows((current) => current.map((row) => (row.id === userId ? { ...row, role: targetRole } : row)))

      const targetUser = rows.find((r) => r.id === userId)
      setSuccess(
        `Approved ${targetUser?.full_name || 'user'} as ${targetRole.toUpperCase()}. Access has been activated.`,
      )
      setTimeout(() => setSuccess(''), 6000)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Approval failed. Please try again.')
    } finally {
      setApprovingId(null)
    }
  }

  const handleSave = async () => {
    if (!hasChanges) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updates = Object.entries(pendingChanges).map(async ([userId, role]) => {
        const response = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, role }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(result?.error?.message ?? result?.error ?? `Failed to update role for user ${userId}.`)
        }
      })

      await Promise.all(updates)

      setInitialRows(rows)
      setSuccess(
        changedCount === 1
          ? 'User role updated successfully. The change was recorded in the audit log.'
          : `${changedCount} user roles updated successfully. Changes were recorded in the audit log.`,
      )
      setTimeout(() => setSuccess(''), 5000)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Role update failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Count tallies by role based on latest row states
  const counts = {
    all: rows.length,
    pending: rows.filter((r) => r.role === 'pending').length,
    staff: rows.filter((r) => r.role === 'staff').length,
    admin: rows.filter((r) => r.role === 'admin').length,
  }

  const filteredRows = rows.filter((u) => {
    if (activeTab !== 'all' && u.role !== activeTab) {
      return false
    }
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (u.full_name?.toLowerCase().includes(q) ?? false) ||
      u.id.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  return (
    <section className="space-y-4">
      {/* Role Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users size={14} />
          All Users
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : counts.pending > 0
                ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock size={14} className={counts.pending > 0 && activeTab !== 'pending' ? 'text-amber-600' : ''} />
          Pending Approval
          {counts.pending > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-500 text-white animate-pulse'
              }`}
            >
              {counts.pending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'staff'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck size={14} />
          Staff
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'staff' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.staff}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'admin'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield size={14} />
          Admins
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'admin' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.admin}
          </span>
        </button>
      </div>

      {/* Top Controls: Instructions, Search, and Save Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl border border-slate-200/80 bg-white/90 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${hasChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
            />
            <span className="text-xs font-semibold text-slate-700">
              {hasChanges
                ? `${changedCount} unsaved role ${changedCount === 1 ? 'change' : 'changes'}`
                : 'All user roles synchronized'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Role changes require an admin account. Your own role cannot be changed here, and at least one admin must
            remain.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, or role..."
              className="w-full sm:w-60 pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                disabled={saving || approvingId !== null}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                <RotateCcw size={13} className="mr-1" />
                Discard
              </Button>
            )}

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving || approvingId !== null}
              className="text-xs font-semibold min-w-[110px] shadow-xs"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save size={14} className="mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800"
        >
          <Check size={16} className="shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Table wrapper with card styling */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Users and assigned roles</caption>
          <thead className="bg-gray-50/80">
            <tr>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                User
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Created
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Quick Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredRows.map((user) => {
              const isModified = pendingChanges[user.id] !== undefined
              const isSelf = user.id === currentUserId
              const isPending = user.role === 'pending'
              const isApproving = approvingId === user.id

              return (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50/70 transition-colors ${
                    isPending ? 'bg-amber-50/20' : isModified ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <th scope="row" className="px-6 py-4 whitespace-nowrap text-left font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{user.full_name || 'Unnamed user'}</span>
                      {isSelf && (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          You
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock size={10} className="text-amber-600" />
                          Awaiting Approval
                        </span>
                      )}
                      {isModified && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 animate-in fade-in">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <span className="block mt-0.5 text-xs text-gray-400 font-mono">{user.id}</span>
                  </th>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="sr-only" htmlFor={`role-${user.id}`}>
                      Role for {user.full_name || user.id}
                    </label>
                    <select
                      id={`role-${user.id}`}
                      className={`border rounded-lg shadow-2xs px-2.5 py-1 text-sm font-medium transition-colors ${
                        isPending
                          ? 'border-amber-300 bg-amber-50/50 text-amber-900 font-semibold'
                          : isModified
                            ? 'border-amber-400 bg-amber-50/60 text-amber-900 focus:ring-amber-500/20'
                            : 'border-gray-300 bg-white text-slate-800 focus:ring-indigo-500/20'
                      }`}
                      value={user.role}
                      disabled={saving || approvingId !== null || isSelf}
                      onChange={(event) => handleRoleSelect(user.id, event.target.value as Role)}
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="pending">Pending</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isPending ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={saving || isApproving}
                        onClick={() => handleQuickApprove(user.id, 'staff')}
                        className="text-xs font-semibold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 hover:border-amber-400 shadow-2xs"
                      >
                        {isApproving ? (
                          'Approving...'
                        ) : (
                          <>
                            <UserCheck size={14} className="mr-1.5 text-amber-700" />
                            Approve as Staff
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  {activeTab === 'pending' ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Check size={20} />
                      </div>
                      <p className="font-medium text-slate-800">No pending approvals</p>
                      <p className="text-xs text-slate-500">All registered users have been approved or reviewed.</p>
                    </div>
                  ) : rows.length === 0 ? (
                    'No users found.'
                  ) : (
                    'No users match your search and filter criteria.'
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky/bottom Action Bar when changes exist on longer tables */}
      {hasChanges && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-xs shadow-xs animate-in fade-in">
          <span className="font-medium text-amber-900">
            You have {changedCount} pending role {changedCount === 1 ? 'change' : 'changes'}. Click &quot;Save
            Changes&quot; to apply.
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              disabled={saving || approvingId !== null}
              className="text-xs text-amber-900 hover:bg-amber-100"
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={saving || approvingId !== null}
              className="text-xs font-semibold shadow-xs"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
