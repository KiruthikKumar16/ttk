'use client'

import { useState } from 'react'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase,
  IdCard,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Clock,
  Code2,
} from 'lucide-react'
import type { Role, UserContactDetails, UserMetadata } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { PillButton } from '@/components/ui/PillButton'
import { Tag } from '@/components/ui/Tag'

type UserSettingsViewProps = {
  initialProfile: {
    id: string
    fullName: string
    role: Role
    createdAt: string | null
    contactDetails?: UserContactDetails
    metadata?: UserMetadata
  }
}

type MetadataEntry = {
  id: string
  key: string
  value: string
}

export function UserSettingsView({ initialProfile }: UserSettingsViewProps) {
  // Profile info
  const [fullName, setFullName] = useState(initialProfile.fullName || '')

  // Contact details
  const initialContacts = initialProfile.contactDetails || {}
  const [phone, setPhone] = useState(String(initialContacts.phone || ''))
  const [altPhone, setAltPhone] = useState(String(initialContacts.altPhone || ''))
  const [contactEmail, setContactEmail] = useState(String(initialContacts.email || ''))
  const [address, setAddress] = useState(String(initialContacts.address || ''))
  const [city, setCity] = useState(String(initialContacts.city || ''))
  const [emergencyContact, setEmergencyContact] = useState(String(initialContacts.emergencyContact || ''))
  const [contactNotes, setContactNotes] = useState(String(initialContacts.notes || ''))

  // Metadata - structured presets
  const initialMeta = initialProfile.metadata || {}
  const [department, setDepartment] = useState(String(initialMeta.department || ''))
  const [designation, setDesignation] = useState(String(initialMeta.designation || ''))
  const [employeeId, setEmployeeId] = useState(String(initialMeta.employeeId || ''))
  const [bio, setBio] = useState(String(initialMeta.bio || ''))
  const [timezone, setTimezone] = useState(String(initialMeta.timezone || 'Asia/Kolkata'))

  // Custom key-value metadata (excluding known presets)
  const knownKeys = new Set(['department', 'designation', 'employeeId', 'bio', 'timezone'])
  const initialCustomEntries: MetadataEntry[] = Object.entries(initialMeta)
    .filter(([k]) => !knownKeys.has(k))
    .map(([k, v]) => ({
      id: Math.random().toString(36).substring(2, 9),
      key: k,
      value: typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''),
    }))

  const [customMetadata, setCustomMetadata] = useState<MetadataEntry[]>(initialCustomEntries)
  const [showJsonPreview, setShowJsonPreview] = useState(false)

  // Status
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleAddMetadataField = () => {
    setCustomMetadata((prev) => [...prev, { id: Math.random().toString(36).substring(2, 9), key: '', value: '' }])
  }

  const handleRemoveMetadataField = (id: string) => {
    setCustomMetadata((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUpdateMetadataField = (id: string, field: 'key' | 'value', text: string) => {
    setCustomMetadata((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: text } : item)))
  }

  const handleReset = () => {
    setFullName(initialProfile.fullName || '')
    setPhone(String(initialContacts.phone || ''))
    setAltPhone(String(initialContacts.altPhone || ''))
    setContactEmail(String(initialContacts.email || ''))
    setAddress(String(initialContacts.address || ''))
    setCity(String(initialContacts.city || ''))
    setEmergencyContact(String(initialContacts.emergencyContact || ''))
    setContactNotes(String(initialContacts.notes || ''))

    setDepartment(String(initialMeta.department || ''))
    setDesignation(String(initialMeta.designation || ''))
    setEmployeeId(String(initialMeta.employeeId || ''))
    setBio(String(initialMeta.bio || ''))
    setTimezone(String(initialMeta.timezone || 'Asia/Kolkata'))
    setCustomMetadata(initialCustomEntries)
    setErrorMsg('')
    setSuccessMsg('')
  }

  // Compile metadata object
  const compiledMetadata: Record<string, unknown> = {}
  if (department.trim()) compiledMetadata.department = department.trim()
  if (designation.trim()) compiledMetadata.designation = designation.trim()
  if (employeeId.trim()) compiledMetadata.employeeId = employeeId.trim()
  if (bio.trim()) compiledMetadata.bio = bio.trim()
  if (timezone.trim()) compiledMetadata.timezone = timezone.trim()
  for (const item of customMetadata) {
    const k = item.key.trim()
    if (k) {
      let val: unknown = item.value
      try {
        if (item.value.startsWith('{') || item.value.startsWith('[')) {
          val = JSON.parse(item.value)
        }
      } catch {
        val = item.value
      }
      compiledMetadata[k] = val
    }
  }

  // Compile contact details object
  const compiledContactDetails: Record<string, unknown> = {}
  if (phone.trim()) compiledContactDetails.phone = phone.trim()
  if (altPhone.trim()) compiledContactDetails.altPhone = altPhone.trim()
  if (contactEmail.trim()) compiledContactDetails.email = contactEmail.trim()
  if (address.trim()) compiledContactDetails.address = address.trim()
  if (city.trim()) compiledContactDetails.city = city.trim()
  if (emergencyContact.trim()) compiledContactDetails.emergencyContact = emergencyContact.trim()
  if (contactNotes.trim()) compiledContactDetails.notes = contactNotes.trim()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          contactDetails: compiledContactDetails,
          metadata: compiledMetadata,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Failed to save user settings.')
      }

      setSuccessMsg('Your user settings, contact details, and metadata have been successfully updated!')
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-6 pb-16">
      {/* Top Banner & Status Alerts */}
      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 border border-[var(--g5)] text-[var(--g1b)] rounded-2xl text-xs font-medium shadow-2xs"
          style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
        >
          <CheckCircle2 size={18} className="text-[var(--g1)] shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-3 p-4 border border-[var(--g5)] text-[var(--g1b)] rounded-2xl text-xs font-medium shadow-2xs"
          style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
        >
          <AlertCircle size={18} className="text-[var(--g1)] shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Profile Header Badge Card */}
      <div
        className="relative overflow-hidden rounded-[26px] p-6 sm:p-8 text-white shadow-md"
        style={{ background: 'var(--g-hero)' }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-extrabold text-2xl shadow-inner border border-white/30 backdrop-blur-xs">
              {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-extrabold tracking-tight text-white">{fullName || 'User Profile'}</h2>
                <Tag variant="accent">
                  <Shield size={11} className="inline mr-1" />
                  {initialProfile.role}
                </Tag>
              </div>
              <p className="text-xs text-white/80 font-mono mt-1">ID: {initialProfile.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/90 bg-white/10 px-3.5 py-2 rounded-full backdrop-blur-xs border border-white/20 font-medium">
            <Clock size={14} />
            <span>
              Member since{' '}
              {initialProfile.createdAt ? new Date(initialProfile.createdAt).toLocaleDateString('en-IN') : 'Recently'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Basic Identity Information */}
        <Card className="p-6 sm:p-7 space-y-6">
          <div className="border-b border-[var(--border)] pb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--panel)] text-[var(--g1)] border border-[var(--border)] flex items-center justify-center font-bold">
              <User size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--ink)]">Personal Identity</h3>
              <p className="text-xs text-[var(--mute)]">Your name and how you appear in logs and communications.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="user-full-name" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Full Name <span className="text-[#b53c37]">*</span>
              </label>
              <input
                id="user-full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kiruthik Kumar"
                className="w-full px-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="user-role-display" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                System Role (Assigned)
              </label>
              <input
                id="user-role-display"
                type="text"
                disabled
                value={`${initialProfile.role.toUpperCase()} (Contact Admin to change)`}
                className="w-full px-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--mute)] cursor-not-allowed font-medium opacity-80"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Contact Details */}
        <Card className="p-6 sm:p-7 space-y-6">
          <div className="border-b border-[var(--border)] pb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--panel)] text-[var(--g1)] border border-[var(--border)] flex items-center justify-center font-bold">
              <Phone size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--ink)]">Contact Details</h3>
              <p className="text-xs text-[var(--mute)]">
                Primary phone, communication email, location, and emergency contact numbers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="user-phone" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Primary Phone Number
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
                <input
                  id="user-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-alt-phone" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Alternate Phone Number
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
                <input
                  id="user-alt-phone"
                  type="tel"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder="e.g. +91 91234 56789"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-contact-email" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Notification / Contact Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
                <input
                  id="user-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. staff.contact@thoorigai.infotech"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-city" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                City / Region
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
                <input
                  id="user-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Madurai, Tamil Nadu"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="user-address" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Office / Work Address
              </label>
              <input
                id="user-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Branch Office, Thoorigai Infotech, Bye-pass Road"
                className="w-full px-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="user-emergency" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Emergency Contact Details
              </label>
              <input
                id="user-emergency"
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. Parent / Spouse Name: +91 99999 88888"
                className="w-full px-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Metadata Attributes */}
        <Card className="p-6 sm:p-7 space-y-6">
          <div className="border-b border-[var(--border)] pb-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--panel)] text-[var(--g1)] border border-[var(--border)] flex items-center justify-center font-bold">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--ink)]">User Metadata &amp; Custom Attributes</h3>
                <p className="text-xs text-[var(--mute)]">
                  Department, title, employee code, and dynamic custom key-value metadata.
                </p>
              </div>
            </div>

            <PillButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowJsonPreview(!showJsonPreview)}
              icon={<Code2 size={13} />}
            >
              {showJsonPreview ? 'Hide JSON' : 'Preview JSON'}
            </PillButton>
          </div>

          {/* Standard Metadata Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="meta-department" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Department
              </label>
              <div className="relative">
                <Building size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
                <input
                  id="meta-department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Training & Academics, Accounts, Admissions"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="meta-designation" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Designation / Job Title
              </label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
                <input
                  id="meta-designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Lead Instructor, Senior Coordinator"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="meta-emp-id" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Employee / Staff ID
              </label>
              <div className="relative">
                <IdCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
                <input
                  id="meta-emp-id"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-2026-088"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="meta-timezone" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Timezone
              </label>
              <input
                id="meta-timezone"
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Kolkata"
                className="w-full px-3.5 py-2.5 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="meta-bio" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Bio / Profile Description
              </label>
              <textarea
                id="meta-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief professional bio or operational responsibilities..."
                className="w-full px-4 py-3 text-xs rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
              />
            </div>
          </div>

          {/* Dynamic Custom Key-Value Metadata Editor */}
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">Custom Metadata Fields</h4>
                <p className="text-[11px] text-[var(--mute)]">
                  Add arbitrary key-value pairs (e.g. slack_id, qualification, blood_group).
                </p>
              </div>
              <PillButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddMetadataField}
                icon={<Plus size={13} />}
              >
                Add Field
              </PillButton>
            </div>

            {customMetadata.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel)] text-center">
                <p className="text-xs text-[var(--mute)]">No custom metadata fields yet.</p>
                <button
                  type="button"
                  onClick={handleAddMetadataField}
                  className="text-xs font-semibold text-[var(--g1)] hover:underline mt-1 cursor-pointer"
                >
                  Click to add a custom attribute
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {customMetadata.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Attribute Key (e.g. slack_handle)"
                      value={entry.key}
                      onChange={(e) => handleUpdateMetadataField(entry.id, 'key', e.target.value)}
                      className="w-1/3 px-3.5 py-2 text-xs font-mono rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)]"
                    />
                    <input
                      type="text"
                      placeholder="Attribute Value (string or JSON)"
                      value={entry.value}
                      onChange={(e) => handleUpdateMetadataField(entry.id, 'value', e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMetadataField(entry.id)}
                      className="p-1.5 text-[var(--mute)] hover:text-[#b53c37] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                      title="Remove attribute"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* JSON Live Preview */}
          {showJsonPreview && (
            <div className="pt-2">
              <label className="block text-xs font-mono text-[var(--mute)] mb-1">Payload JSON Preview:</label>
              <pre className="p-4 bg-[var(--panel)] text-[var(--ink)] rounded-2xl text-xs font-mono overflow-x-auto max-h-48 border border-[var(--border)]">
                {JSON.stringify({ contactDetails: compiledContactDetails, metadata: compiledMetadata }, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <PillButton
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={saving}
            icon={<RotateCcw size={13} />}
          >
            Reset to Saved
          </PillButton>

          <PillButton type="submit" variant="primary" disabled={saving} icon={<Save size={14} />}>
            {saving ? 'Saving Settings...' : 'Save Settings'}
          </PillButton>
        </div>
      </form>
    </div>
  )
}
