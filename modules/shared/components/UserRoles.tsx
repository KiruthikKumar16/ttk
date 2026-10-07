'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Role, InviteCode, UserContactDetails, UserMetadata } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
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
  UserCog,
  Phone,
  Mail,
  Building,
  History,
  UserMinus,
  ShieldAlert,
} from 'lucide-react'

type UserProfile = {
  id: string
  full_name: string | null
  role: Role
  created_at: string | null
  contact_details?: UserContactDetails
  metadata?: UserMetadata
}
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

  // Edit User Details & Metadata Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAltPhone, setEditAltPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editEmergency, setEditEmergency] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editDesignation, setEditDesignation] = useState('')
  const [editEmpId, setEditEmpId] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editCustomMeta, setEditCustomMeta] = useState<{ id: string; key: string; value: string }[]>([])
  const [savingDetails, setSavingDetails] = useState(false)
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserProfile | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user)
    setEditFullName(user.full_name || '')
    const contact = (user.contact_details as Record<string, unknown>) || {}
    setEditPhone(String(contact.phone || ''))
    setEditAltPhone(String(contact.altPhone || ''))
    setEditEmail(String(contact.email || ''))
    setEditAddress(String(contact.address || ''))
    setEditCity(String(contact.city || ''))
    setEditEmergency(String(contact.emergencyContact || ''))

    const meta = (user.metadata as Record<string, unknown>) || {}
    setEditDepartment(String(meta.department || ''))
    setEditDesignation(String(meta.designation || ''))
    setEditEmpId(String(meta.employeeId || ''))
    setEditBio(String(meta.bio || ''))

    const knownKeys = new Set(['department', 'designation', 'employeeId', 'bio', 'timezone'])
    const custom = Object.entries(meta)
      .filter(([k]) => !knownKeys.has(k))
      .map(([k, v]) => ({
        id: Math.random().toString(36).substring(2, 9),
        key: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''),
      }))
    setEditCustomMeta(custom)
  }

  const handleSaveUserDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setSavingDetails(true)
    setError('')
    setSuccess('')

    const compiledContact: Record<string, unknown> = {}
    if (editPhone.trim()) compiledContact.phone = editPhone.trim()
    if (editAltPhone.trim()) compiledContact.altPhone = editAltPhone.trim()
    if (editEmail.trim()) compiledContact.email = editEmail.trim()
    if (editAddress.trim()) compiledContact.address = editAddress.trim()
    if (editCity.trim()) compiledContact.city = editCity.trim()
    if (editEmergency.trim()) compiledContact.emergencyContact = editEmergency.trim()

    const compiledMeta: Record<string, unknown> = {}
    if (editDepartment.trim()) compiledMeta.department = editDepartment.trim()
    if (editDesignation.trim()) compiledMeta.designation = editDesignation.trim()
    if (editEmpId.trim()) compiledMeta.employeeId = editEmpId.trim()
    if (editBio.trim()) compiledMeta.bio = editBio.trim()
    for (const item of editCustomMeta) {
      if (item.key.trim()) {
        try {
          if (item.value.startsWith('{') || item.value.startsWith('[')) {
            compiledMeta[item.key.trim()] = JSON.parse(item.value)
          } else {
            compiledMeta[item.key.trim()] = item.value
          }
        } catch {
          compiledMeta[item.key.trim()] = item.value
        }
      }
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          fullName: editFullName.trim(),
          contactDetails: compiledContact,
          metadata: compiledMeta,
        }),
      })

      const result = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(getErrorMessage(result, 'Failed to update user settings.'))
      }

      setRows((current) =>
        current.map((r) =>
          r.id === editingUser.id
            ? {
                ...r,
                full_name: editFullName.trim(),
                contact_details: compiledContact as UserContactDetails,
                metadata: compiledMeta as UserMetadata,
              }
            : r,
        ),
      )
      setInitialRows((current) =>
        current.map((r) =>
          r.id === editingUser.id
            ? {
                ...r,
                full_name: editFullName.trim(),
                contact_details: compiledContact as UserContactDetails,
                metadata: compiledMeta as UserMetadata,
              }
            : r,
        ),
      )

      setSuccess(`Updated contact details and metadata for ${editFullName.trim() || editingUser.id}.`)
      setEditingUser(null)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user settings.')
    } finally {
      setSavingDetails(false)
    }
  }

  const handleRevokeUserAccess = async (userId: string) => {
    setRevokingUserId(userId)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: 'pending' }),
      })
      const result = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(getErrorMessage(result, 'Failed to revoke user access.'))
      }
      setRows((current) => current.map((r) => (r.id === userId ? { ...r, role: 'pending' as Role } : r)))
      setInitialRows((current) => current.map((r) => (r.id === userId ? { ...r, role: 'pending' as Role } : r)))
      if (editingUser?.id === userId) {
        setEditingUser((prev) => (prev ? { ...prev, role: 'pending' as Role } : null))
      }
      setSuccess('User access has been revoked. Account is now set to Pending approval.')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke user access.')
    } finally {
      setRevokingUserId(null)
    }
  }

  const handleRemoveUser = async () => {
    if (!confirmDeleteUser) return
    const userId = confirmDeleteUser.id
    setDeletingUserId(userId)
    setError('')
    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(getErrorMessage(result, 'Failed to remove user account.'))
      }
      setRows((current) => current.filter((r) => r.id !== userId))
      setInitialRows((current) => current.filter((r) => r.id !== userId))
      if (editingUser?.id === userId) {
        setEditingUser(null)
      }
      setSuccess(`User "${confirmDeleteUser.full_name || userId}" has been removed.`)
      setConfirmDeleteUser(null)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user.')
    } finally {
      setDeletingUserId(null)
    }
  }

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

  const handleQuickApprove = async (userId: string, targetRole?: Role) => {
    const selectedUser = rows.find((r) => r.id === userId)
    const roleToApply: Role =
      targetRole || (selectedUser && selectedUser.role !== 'pending' ? selectedUser.role : 'staff')

    setApprovingId(userId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: roleToApply }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(getErrorMessage(result, `Failed to approve user ${userId}.`))
      }

      setRows((current) => current.map((row) => (row.id === userId ? { ...row, role: roleToApply } : row)))
      setInitialRows((current) => current.map((row) => (row.id === userId ? { ...row, role: roleToApply } : row)))

      setSuccess(
        `Approved ${selectedUser?.full_name || 'user'} as ${roleToApply.toUpperCase()}. Access has been activated.`,
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
    <section className="space-y-6">
      {/* Role Filter Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-nowrap overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:pb-0 items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[var(--g1)] text-white shadow-xs'
                : 'bg-[var(--card)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--panel)]'
            }`}
          >
            <Users size={13} />
            All Users
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#854d0e] text-white shadow-xs'
                : counts.pending > 0
                  ? 'bg-[rgba(133,77,14,0.08)] text-[#854d0e] border border-[rgba(133,77,14,0.25)] hover:bg-[rgba(133,77,14,0.15)]'
                  : 'bg-[var(--card)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--panel)]'
            }`}
          >
            <Clock size={13} className={counts.pending > 0 && activeTab !== 'pending' ? 'text-[#854d0e]' : ''} />
            Pending Approval
            {counts.pending > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-[#854d0e] text-white animate-pulse'
                }`}
              >
                {counts.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-[var(--g1)] text-white shadow-xs'
                : 'bg-[var(--card)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--panel)]'
            }`}
          >
            <UserCheck size={13} />
            Staff
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'staff' ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
              }`}
            >
              {counts.staff}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                : 'bg-[var(--card)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--panel)]'
            }`}
          >
            <Shield size={13} />
            Admins
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'admin' ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
              }`}
            >
              {counts.admin}
            </span>
          </button>

          <div className="h-4 w-px bg-[var(--border)] mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => setActiveTab('invites')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'invites'
                ? 'bg-[var(--g1)] text-white shadow-xs'
                : 'bg-[var(--card)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--panel)]'
            }`}
          >
            <KeyRound size={13} />
            One-Time Invite Codes
            {counts.activeInvites > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'invites' ? 'bg-white/20 text-white' : 'bg-[var(--g1)] text-white'
                }`}
              >
                {counts.activeInvites}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setGeneratedInvite(null)
            setShowGenerateModal(true)
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--g1)] text-white hover:opacity-90 transition-opacity shadow-xs shrink-0 cursor-pointer"
        >
          <Plus size={14} className="mr-1" />
          Generate Invite Code
        </button>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-[22px] border border-[var(--border)] bg-[var(--card)] shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${hasChanges ? 'bg-[#854d0e] animate-pulse' : 'bg-[#1b7a4b]'}`}
                />
                <span className="text-xs font-semibold text-[var(--ink)]">
                  {hasChanges
                    ? `${changedCount} unsaved role ${changedCount === 1 ? 'change' : 'changes'}`
                    : 'All user roles synchronized'}
                </span>
              </div>
              <p className="text-xs text-[var(--mute)]">
                Role changes require an admin account. Your own role cannot be changed here, and at least one admin must
                remain.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, ID, or role..."
                  className="w-full sm:w-60 pl-9 pr-3.5 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors bg-[var(--panel)]"
                />
              </div>

              <div className="flex items-center gap-2">
                {hasChanges && (
                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={saving || approvingId !== null}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--panel)] transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} className="mr-1" />
                    Discard
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanges || saving || approvingId !== null}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--g1)] text-white hover:opacity-90 transition-opacity shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save size={14} className="mr-1.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Table wrapper with card styling */}
          <div
            className="bg-[var(--card)] rounded-[26px] shadow-xs border border-[var(--border)] overflow-x-auto w-full"
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
                        {(user.contact_details?.phone || user.contact_details?.email || user.metadata?.department) && (
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                            {user.contact_details?.phone && (
                              <span className="inline-flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                <Phone size={10} className="text-slate-400" />
                                {user.contact_details.phone}
                              </span>
                            )}
                            {user.contact_details?.email && (
                              <span className="inline-flex items-center gap-1 text-slate-600">
                                <Mail size={10} className="text-slate-400" />
                                {user.contact_details.email}
                              </span>
                            )}
                            {user.metadata?.department && (
                              <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded border border-teal-200 text-[10px] font-medium">
                                <Building size={10} className="text-teal-600" />
                                {user.metadata.department}
                              </span>
                            )}
                          </div>
                        )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                        <Link
                          href={`/audit-log?userName=${encodeURIComponent(user.full_name || '')}&search=${encodeURIComponent(user.id)}`}
                          className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                          title="View user activity and audit log"
                        >
                          <History size={13} className="mr-1 text-slate-500" />
                          User Log
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(user)}
                          className="text-xs text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50 px-2.5 py-1"
                          title="Edit user settings, contact details & metadata"
                        >
                          <UserCog size={13} className="mr-1 text-slate-500" />
                          Settings & Info
                        </Button>
                        {!isSelf && user.role !== 'pending' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={saving || revokingUserId === user.id}
                            onClick={() => handleRevokeUserAccess(user.id)}
                            className="text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-50 px-2 py-1"
                            title="Revoke access immediately (demote to Pending)"
                          >
                            <UserMinus size={13} className="mr-1 text-amber-600" />
                            {revokingUserId === user.id ? 'Revoking...' : 'Revoke'}
                          </Button>
                        )}
                        {isPending && (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={saving || isApproving}
                              onClick={() => handleQuickApprove(user.id, user.role === 'admin' ? 'admin' : 'staff')}
                              className="text-xs font-semibold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 hover:border-amber-400 shadow-2xs"
                              title="Approve user with Staff privileges"
                            >
                              {isApproving ? (
                                'Approving...'
                              ) : (
                                <>
                                  <UserCheck size={14} className="mr-1 text-amber-700" />
                                  Approve as Staff
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={saving || isApproving}
                              onClick={() => handleQuickApprove(user.id, 'admin')}
                              className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs px-2.5 py-1"
                              title="Approve user with Administrator privileges"
                            >
                              {isApproving ? (
                                'Approving...'
                              ) : (
                                <>
                                  <Shield size={13} className="mr-1 text-purple-200" />
                                  Approve as Admin
                                </>
                              )}
                            </Button>
                          </div>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Role</label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setGenRole('staff')}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          genRole === 'staff'
                            ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <UserCheck
                          size={16}
                          className={`mt-0.5 shrink-0 ${genRole === 'staff' ? 'text-indigo-600' : 'text-slate-400'}`}
                        />
                        <div>
                          <span
                            className={`block text-xs font-bold ${genRole === 'staff' ? 'text-indigo-950' : 'text-slate-700'}`}
                          >
                            Staff Access
                          </span>
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">Code: STAFF-XXXX</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGenRole('admin')}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          genRole === 'admin'
                            ? 'bg-purple-50/90 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Shield
                          size={16}
                          className={`mt-0.5 shrink-0 ${genRole === 'admin' ? 'text-purple-600' : 'text-slate-400'}`}
                        />
                        <div>
                          <span
                            className={`block text-xs font-bold ${genRole === 'admin' ? 'text-purple-950' : 'text-slate-700'}`}
                          >
                            Admin Access
                          </span>
                          <span className="block text-[10px] text-purple-600 font-mono font-medium mt-0.5">
                            Code: ADMIN-XXXX
                          </span>
                        </div>
                      </button>
                    </div>

                    <select
                      id="invite-role-select"
                      aria-label="Assigned Role"
                      value={genRole}
                      onChange={(e) => setGenRole(e.target.value as 'staff' | 'admin')}
                      className="sr-only"
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
                    className={`text-xs font-semibold text-white shadow-xs ${
                      genRole === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {generating ? 'Generating...' : `Generate ${genRole === 'admin' ? 'Admin' : 'Staff'} Code`}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER SETTINGS, CONTACT DETAILS & METADATA */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="text-xs uppercase font-bold text-teal-700 tracking-wider">User Settings</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Contact Details & Metadata for {editingUser.full_name || 'User'}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {editingUser.id}</p>
              </div>
              <Link
                href={`/audit-log?userName=${encodeURIComponent(editingUser.full_name || '')}&search=${encodeURIComponent(editingUser.id)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shrink-0"
                title="View user activity & audit log"
              >
                <History size={14} className="text-slate-600" />
                View User Log
              </Link>
            </div>

            <form onSubmit={handleSaveUserDetails} className="space-y-6">
              {/* Identity & Basic Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Profile Name
                </h4>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Primary Phone</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Alternate Phone</label>
                    <input
                      type="tel"
                      value={editAltPhone}
                      onChange={(e) => setEditAltPhone(e.target.value)}
                      placeholder="+91 91234 56789"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">City / Region</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Madurai, Tamil Nadu"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Office / Address</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Branch location or residence address"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={editEmergency}
                      onChange={(e) => setEditEmergency(e.target.value)}
                      placeholder="Contact Name & Number"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Operational Metadata
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      placeholder="Academics, Training, Accounts"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={editDesignation}
                      onChange={(e) => setEditDesignation(e.target.value)}
                      placeholder="Instructor, Coordinator"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Employee / Staff ID</label>
                    <input
                      type="text"
                      value={editEmpId}
                      onChange={(e) => setEditEmpId(e.target.value)}
                      placeholder="EMP-012"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Bio / Notes</label>
                    <textarea
                      rows={2}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Operational notes or user bio"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </div>

                {/* Custom Metadata Key-Values */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase">
                      Custom Metadata Attributes
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditCustomMeta((prev) => [
                          ...prev,
                          { id: Math.random().toString(36).substring(2, 9), key: '', value: '' },
                        ])
                      }
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Attribute
                    </button>
                  </div>
                  {editCustomMeta.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={item.key}
                        onChange={(e) =>
                          setEditCustomMeta((prev) =>
                            prev.map((c) => (c.id === item.id ? { ...c, key: e.target.value } : c)),
                          )
                        }
                        className="w-1/3 px-2.5 py-1 text-xs font-mono border border-slate-300 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) =>
                          setEditCustomMeta((prev) =>
                            prev.map((c) => (c.id === item.id ? { ...c, value: e.target.value } : c)),
                          )
                        }
                        className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => setEditCustomMeta((prev) => prev.filter((c) => c.id !== item.id))}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Access & Danger Zone */}
              {editingUser.id !== currentUserId && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-rose-600" />
                    <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                      Account Access & Management
                    </h4>
                  </div>
                  <p className="text-xs text-rose-700">
                    Revoke access to immediately suspend this user from accessing the system, or permanently remove
                    their account.
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {editingUser.role !== 'pending' ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          savingDetails || revokingUserId === editingUser.id || deletingUserId === editingUser.id
                        }
                        onClick={() => handleRevokeUserAccess(editingUser.id)}
                        className="text-xs font-semibold border-amber-300 text-amber-900 hover:bg-amber-100 bg-white"
                        title="Demote to Pending approval"
                      >
                        <UserMinus size={14} className="mr-1.5 text-amber-700" />
                        {revokingUserId === editingUser.id ? 'Revoking...' : 'Revoke Access (Set Pending)'}
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-md border border-amber-200">
                        Access is currently revoked (Pending)
                      </span>
                    )}

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={savingDetails || revokingUserId === editingUser.id || deletingUserId === editingUser.id}
                      onClick={() => setConfirmDeleteUser(editingUser)}
                      className="text-xs font-semibold shadow-xs"
                      title="Permanently remove user account"
                    >
                      <Trash2 size={14} className="mr-1.5" />
                      Remove User
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  className="text-xs text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingDetails}
                  size="sm"
                  className="text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-xs"
                >
                  {savingDetails ? 'Saving...' : 'Save User Details'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteUser && (
        <ConfirmDialog
          isOpen={true}
          title={`Remove User "${confirmDeleteUser.full_name || confirmDeleteUser.id}"?`}
          description="Are you sure you want to permanently delete this user account? This will immediately revoke all access and remove their profile. This action cannot be undone."
          confirmText={deletingUserId ? 'Removing...' : 'Permanently Remove User'}
          cancelText="Cancel"
          destructive={true}
          onConfirm={handleRemoveUser}
          onCancel={() => !deletingUserId && setConfirmDeleteUser(null)}
        />
      )}
    </section>
  )
}
