'use client'

import { useState, useEffect } from 'react'
import type { Role, InviteCode } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Search,
  UserCheck,
  Clock,
  Shield,
  Users,
  KeyRound,
  Plus,
  Copy,
  Trash2,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

type UserProfile = { id: string; full_name: string | null; role: Role; created_at: string | null }
type FilterTab = 'all' | 'pending' | 'staff' | 'admin' | 'invites'

function getErrorMessage(result: unknown, fallback: string): string {
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>
    if (typeof r.error === 'string') return r.error
    if (r.error && typeof r.error === 'object') {
      const errObj = r.error as Record<string, unknown>
      if (typeof errObj.message === 'string') return errObj.message
    }
    if (typeof r.message === 'string') return r.message
  }
  return fallback
}

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
    initialFilter && ['pending', 'staff', 'admin', 'invites'].includes(initialFilter)
      ? (initialFilter as FilterTab)
      : 'all',
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // Invite Codes State
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [genRole, setGenRole] = useState<'staff' | 'admin'>('staff')
  const [genExpiryHours, setGenExpiryHours] = useState(24)
  const [genRecipientEmail, setGenRecipientEmail] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedInvite, setGeneratedInvite] = useState<{
    code: string
    role: string
    expiresAt: string
    recipientEmail?: string | null
  } | null>(null)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fetchInviteCodes = async () => {
    setLoadingInvites(true)
    try {
      const res = await fetch('/api/admin/invite-codes')
      const json = await res.json().catch(() => null)
      if (res.ok && json) {
        setInviteCodes(json.data ?? json ?? [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingInvites(false)
    }
  }

  useEffect(() => {
    fetchInviteCodes()
  }, [])

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
        throw new Error(getErrorMessage(result, `Failed to approve user ${userId}.`))
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
          throw new Error(getErrorMessage(result, `Failed to update role for user ${userId}.`))
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

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/admin/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: genRole,
          expiresInHours: Number(genExpiryHours),
          recipientEmail: genRecipientEmail.trim() || null,
        }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Failed to generate invite code.'))
      }

      setGeneratedInvite(result?.data?.invite ?? result?.invite ?? null)
      fetchInviteCodes()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate invite code.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRevokeInvite = async (id: string) => {
    setRevokingId(id)
    setError('')
    try {
      const response = await fetch(`/api/admin/invite-codes?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Failed to revoke invite code.'))
      }
      setInviteCodes((prev) => prev.filter((c) => c.id !== id))
      setSuccess('Invite code was revoked and can no longer be used.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invite code.')
    } finally {
      setRevokingId(null)
    }
  }

  const copyToClipboard = async (text: string, id: string, type: 'code' | 'link') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        throw new Error('Clipboard API unavailable')
      }
    } catch {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      } catch {
        // Ignore fallback failure silently
      }
    }
    if (type === 'code') {
      setCopiedCodeId(id)
      setTimeout(() => setCopiedCodeId(null), 2500)
    } else {
      setCopiedLinkId(id)
      setTimeout(() => setCopiedLinkId(null), 2500)
    }
  }

  // Count tallies by role based on latest row states
  const counts = {
    all: rows.length,
    pending: rows.filter((r) => r.role === 'pending').length,
    staff: rows.filter((r) => r.role === 'staff').length,
    admin: rows.filter((r) => r.role === 'admin').length,
    activeInvites: inviteCodes.filter((c) => !c.isUsed && new Date(c.expiresAt).getTime() > Date.now()).length,
  }

  const filteredRows = rows.filter((u) => {
    if (activeTab !== 'all' && activeTab !== 'invites' && u.role !== activeTab) {
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

  const getInviteStatus = (invite: InviteCode) => {
    if (invite.isUsed) {
      return {
        label: 'Redeemed',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        detail: invite.usedByUserName ? `by ${invite.usedByUserName}` : 'Used',
      }
    }
    const isExpired = new Date(invite.expiresAt).getTime() <= Date.now()
    if (isExpired) {
      return {
        label: 'Expired',
        badge: 'bg-slate-100 text-slate-600 border-slate-200',
        detail: 'Code expired',
      }
    }
    const hoursLeft = Math.max(1, Math.round((new Date(invite.expiresAt).getTime() - Date.now()) / (3600 * 1000)))
    return {
      label: 'Active',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      detail: hoursLeft >= 24 ? `Expires in ${Math.round(hoursLeft / 24)}d` : `Expires in ${hoursLeft}h`,
    }
  }

  return (
    <section className="space-y-4">
      {/* Role Filter Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex flex-nowrap overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:pb-0 items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users size={13} />
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : counts.pending > 0
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock size={13} className={counts.pending > 0 && activeTab !== 'pending' ? 'text-amber-600' : ''} />
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'staff'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck size={13} />
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield size={13} />
            Admins
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'admin' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.admin}
            </span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => setActiveTab('invites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'invites'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-700 bg-teal-50/60 border border-teal-200/80 hover:bg-teal-100/70'
            }`}
          >
            <KeyRound size={13} />
            One-Time Invite Codes
            {counts.activeInvites > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'invites' ? 'bg-teal-800 text-white' : 'bg-teal-600 text-white'
                }`}
              >
                {counts.activeInvites}
              </span>
            )}
          </button>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => {
            setGeneratedInvite(null)
            setShowGenerateModal(true)
          }}
          className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shrink-0"
        >
          <Plus size={14} className="mr-1" />
          Generate Invite Code
        </Button>
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 animate-in fade-in"
        >
          <Check size={16} className="shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* VIEW A: INVITE CODES TAB */}
      {activeTab === 'invites' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-teal-200/80 bg-teal-50/40 text-xs text-teal-900">
            <div>
              <p className="font-semibold text-teal-950 flex items-center gap-1.5 text-sm">
                <KeyRound size={16} className="text-teal-700" />
                One-Time Disposable Invite Codes (OTP)
              </p>
              <p className="text-teal-700 mt-0.5 text-xs">
                Invite codes expire automatically and are permanently burned after a single registration. Users signing
                up with an active code receive instant access without waiting for admin approval.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setGeneratedInvite(null)
                setShowGenerateModal(true)
              }}
              className="text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shrink-0"
            >
              <Plus size={13} className="mr-1" />
              New Code
            </Button>
          </div>

          <div
            className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-x-auto w-full"
            role="region"
            aria-label="One-time invite codes"
            tabIndex={0}
          >
            <table className="min-w-[640px] w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Invite Code
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Assigned Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Restriction / Recipient
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {inviteCodes.map((invite) => {
                  const status = getInviteStatus(invite)
                  const isRevoking = revokingId === invite.id
                  const isCopiedCode = copiedCodeId === invite.id
                  const isCopiedLink = copiedLinkId === invite.id
                  const origin = typeof window !== 'undefined' ? window.location.origin : ''
                  const inviteUrl = `${origin}/signup?code=${invite.code}`

                  return (
                    <tr key={invite.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200 tracking-wide select-all">
                            {invite.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(invite.code, invite.id, 'code')}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Copy code"
                          >
                            {isCopiedCode ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Created {new Date(invite.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            invite.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {invite.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        {invite.recipientEmail ? (
                          <span className="font-mono font-medium text-slate-800">{invite.recipientEmail}</span>
                        ) : (
                          <span className="text-slate-400 italic">Anyone with code</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${status.badge}`}
                        >
                          {status.label}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{status.detail}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                        {!invite.isUsed ? (
                          <>
                            {new Date(invite.expiresAt).getTime() > Date.now() && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(inviteUrl, invite.id, 'link')}
                                className="text-xs border-slate-300 hover:bg-slate-50"
                              >
                                {isCopiedLink ? (
                                  <>
                                    <Check size={13} className="mr-1 text-emerald-600" /> Copied Link
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink size={13} className="mr-1" /> Copy Link
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={isRevoking}
                              onClick={() => handleRevokeInvite(invite.id)}
                              className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 size={13} className="mr-1" />
                              {isRevoking ? 'Revoking...' : 'Revoke'}
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {inviteCodes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      {loadingInvites ? (
                        'Loading invite codes...'
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                            <KeyRound size={20} />
                          </div>
                          <p className="font-semibold text-slate-800">No invite codes generated yet</p>
                          <p className="text-xs text-slate-500">
                            Create one-time expiring codes to invite staff members with instant authorization.
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowGenerateModal(true)}
                            className="text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white mt-2"
                          >
                            <Plus size={13} className="mr-1" />
                            Generate First Code
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW B: USERS & ROLES TABLE */
        <>
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
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
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

          {/* Table wrapper with card styling */}
          <div
            className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-x-auto w-full"
            role="region"
            aria-label="Users and roles"
            tabIndex={0}
          >
            <table className="min-w-[640px] w-full divide-y divide-gray-200">
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
                          <span className="text-sm font-semibold text-slate-900">
                            {user.full_name || 'Unnamed user'}
                          </span>
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
        </>
      )}

      {/* MODAL: GENERATE INVITE CODE */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 relative">
            <button
              type="button"
              onClick={() => {
                setShowGenerateModal(false)
                setGeneratedInvite(null)
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            {generatedInvite ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles size={24} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">Invite Code Created</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Share this one-time code or direct link with your new{' '}
                    <strong className="text-slate-800 uppercase">{generatedInvite.role}</strong>. It expires
                    automatically.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    One-Time Code
                  </span>
                  <p className="font-mono text-xl font-extrabold text-indigo-700 tracking-wider select-all">
                    {generatedInvite.code}
                  </p>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Expires {new Date(generatedInvite.expiresAt).toLocaleString('en-IN')} · Single use only
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedInvite.code, 'modal', 'code')}
                    className="text-xs font-semibold"
                  >
                    {copiedCodeId === 'modal' ? (
                      <>
                        <Check size={14} className="mr-1 text-emerald-600" /> Copied Code
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="mr-1" /> Copy Code
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : ''
                      copyToClipboard(`${origin}/signup?code=${generatedInvite.code}`, 'modal-link', 'link')
                    }}
                    className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {copiedLinkId === 'modal-link' ? (
                      <>
                        <Check size={14} className="mr-1 text-emerald-200" /> Copied Link
                      </>
                    ) : (
                      <>
                        <ExternalLink size={14} className="mr-1" /> Copy Link
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowGenerateModal(false)
                    setGeneratedInvite(null)
                  }}
                  className="w-full text-xs text-slate-600 hover:text-slate-900"
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleGenerateInvite} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Generate Invite Code</h3>
                    <p className="text-xs text-slate-500">Create an expiring, one-time invitation code.</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label htmlFor="invite-role-select" className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Role
                    </label>
                    <select
                      id="invite-role-select"
                      aria-label="Assigned Role"
                      value={genRole}
                      onChange={(e) => setGenRole(e.target.value as 'staff' | 'admin')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      <option value="staff">Staff (Standard Academy Access)</option>
                      <option value="admin">Admin (Full System Privilege)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="invite-expiry-select" className="block text-xs font-semibold text-slate-700 mb-1">
                      Expiration Window
                    </label>
                    <select
                      id="invite-expiry-select"
                      aria-label="Expiration Window"
                      value={genExpiryHours}
                      onChange={(e) => setGenExpiryHours(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      <option value={24}>24 Hours (Recommended)</option>
                      <option value={72}>3 Days (72 Hours)</option>
                      <option value={168}>7 Days (1 Week)</option>
                      <option value={1}>1 Hour (Express Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Restrict to Email <span className="font-normal text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rajesh@thoorigai.local (leave blank for any email)"
                      value={genRecipientEmail}
                      onChange={(e) => setGenRecipientEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      If set, only a user registering with this exact email can redeem this code.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGenerateModal(false)}
                    className="text-xs text-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={generating}
                    size="sm"
                    className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    {generating ? 'Generating...' : 'Generate Code'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
