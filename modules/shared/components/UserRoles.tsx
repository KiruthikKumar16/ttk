'use client'

import { useState } from 'react'
import type { Role } from '@/lib/types'

type UserProfile = { id: string; full_name: string | null; role: Role; created_at: string | null }

export function UserRoles({ users, currentUserId }: { users: UserProfile[]; currentUserId: string }) {
  const [rows, setRows] = useState(users)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  async function changeRole(userId: string, role: Role) {
    const previous = rows.find((row) => row.id === userId)?.role
    if (!previous || previous === role) return
    setRows((current) => current.map((row) => (row.id === userId ? { ...row, role } : row)))
    setSaving(userId)
    setError('')
    setStatus('Saving role change…')
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error?.message ?? result?.error ?? 'Role update failed. Try again.')
      }
      setStatus(`Role updated to ${role}. The change was recorded in the audit log.`)
    } catch (cause) {
      setRows((current) => current.map((row) => (row.id === userId ? { ...row, role: previous } : row)))
      setError(cause instanceof Error ? cause.message : 'Role update failed. Try again.')
      setStatus('')
    } finally {
      setSaving(null)
    }
  }

  return (
    <section className="panel">
      <p className="mb-4 text-sm text-muted-foreground">
        Role changes require an admin account with MFA. Your own role cannot be changed here, and at least one admin
        must remain.
      </p>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
      <div className="data-wrap">
        <table>
          <caption className="sr-only">Users and assigned roles</caption>
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Role</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id}>
                <th scope="row">
                  {user.full_name || 'Unnamed user'}
                  <span className="mt-1 block font-normal text-xs text-muted-foreground">{user.id}</span>
                </th>
                <td>
                  <label className="sr-only" htmlFor={`role-${user.id}`}>
                    Role for {user.full_name || user.id}
                  </label>
                  <select
                    id={`role-${user.id}`}
                    className="input min-h-10 w-full max-w-40"
                    value={user.role}
                    disabled={saving !== null || user.id === currentUserId}
                    onChange={(event) => void changeRole(user.id, event.target.value as Role)}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="trainer">Trainer</option>
                  </select>
                </td>
                <td>{user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
