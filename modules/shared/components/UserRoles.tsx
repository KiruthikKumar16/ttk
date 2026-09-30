'use client'

import { useState } from 'react'
import type { Role } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Save, RotateCcw, Check, AlertCircle, Search } from 'lucide-react'

type UserProfile = { id: string; full_name: string | null; role: Role; created_at: string | null }

export function UserRoles({ users, currentUserId }: { users: UserProfile[]; currentUserId: string }) {
  const [initialRows, setInitialRows] = useState<UserProfile[]>(users)
  const [rows, setRows] = useState<UserProfile[]>(users)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

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

  const filteredRows = rows.filter((u) => {
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
                disabled={saving}
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
              disabled={!hasChanges || saving}
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredRows.map((user) => {
              const isModified = pendingChanges[user.id] !== undefined
              const isSelf = user.id === currentUserId

              return (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50/70 transition-colors ${isModified ? 'bg-amber-50/40' : ''}`}
                >
                  <th scope="row" className="px-6 py-4 whitespace-nowrap text-left font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{user.full_name || 'Unnamed user'}</span>
                      {isSelf && (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          You
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
                        isModified
                          ? 'border-amber-400 bg-amber-50/60 text-amber-900 focus:ring-amber-500/20'
                          : 'border-gray-300 bg-white text-slate-800 focus:ring-indigo-500/20'
                      }`}
                      value={user.role}
                      disabled={saving || isSelf}
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
                </tr>
              )
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                  {rows.length === 0 ? 'No users found.' : 'No users match your search.'}
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
              disabled={saving}
              className="text-xs text-amber-900 hover:bg-amber-100"
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={saving}
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
