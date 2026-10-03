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
  FileText,
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
import { Button } from '@/components/ui/button'
import type { Role, UserContactDetails, UserMetadata } from '@/lib/types'

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
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner & Status Alerts */}
      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm shadow-xs animate-in fade-in"
        >
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm shadow-xs animate-in fade-in"
        >
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Profile Header Badge Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-inner border border-white/20">
              {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold tracking-tight text-white">{fullName || 'User Profile'}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30 uppercase tracking-wider">
                  <Shield size={12} />
                  {initialProfile.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-1">ID: {initialProfile.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-xs border border-white/10">
            <Clock size={14} className="text-teal-400" />
            <span>
              Member since{' '}
              {initialProfile.createdAt ? new Date(initialProfile.createdAt).toLocaleDateString('en-IN') : 'Recently'}
            </span>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Basic Identity Information */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Personal Identity</h3>
              <p className="text-xs text-slate-500">Your name and how you appear in logs and communications.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="user-full-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="user-full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kiruthik Kumar"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors bg-slate-50/50"
              />
            </div>

            <div>
              <label htmlFor="user-role-display" className="block text-xs font-semibold text-slate-700 mb-1.5">
                System Role (Assigned)
              </label>
              <input
                id="user-role-display"
                type="text"
                disabled
                value={`${initialProfile.role.toUpperCase()} (Contact Admin to change)`}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Contact Details */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Phone size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Contact Details</h3>
              <p className="text-xs text-slate-500">
                Primary phone, communication email, location, and emergency contact numbers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="user-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Phone Number
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="user-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-alt-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alternate Phone Number
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="user-alt-phone"
                  type="tel"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder="e.g. +91 91234 56789"
                  className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-contact-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Notification / Contact Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="user-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. staff.contact@elysium.academy"
                  className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-city" className="block text-xs font-semibold text-slate-700 mb-1.5">
                City / Region
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="user-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Madurai, Tamil Nadu"
                  className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="user-address" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Office / Work Address
              </label>
              <input
                id="user-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Branch Office, Elysium Academy, Bye-pass Road"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="user-emergency" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Emergency Contact Details
              </label>
              <input
                id="user-emergency"
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. Parent / Spouse Name: +91 99999 88888"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Metadata Attributes */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">User Metadata & Custom Attributes</h3>
                <p className="text-xs text-slate-500">
                  Department, title, employee code, and dynamic custom key-value metadata.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowJsonPreview(!showJsonPreview)}
              className="text-xs border-slate-200 text-slate-600 hover:text-slate-900"
            >
              <Code2 size={13} className="mr-1.5" />
              {showJsonPreview ? 'Hide JSON' : 'Preview JSON'}
            </Button>
          </div>

          {/* Standard Metadata Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="meta-department" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Department
              </label>
              <div className="relative">
                <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="meta-department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Training & Academics, Accounts, Admissions"
                  className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="meta-designation" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Designation / Job Title
              </label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="meta-designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Lead Instructor, Senior Coordinator"
                  className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="meta-emp-id" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Employee / Staff ID
              </label>
              <div className="relative">
                <IdCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="meta-emp-id"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-2026-088"
                  className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="meta-timezone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Timezone
              </label>
              <input
                id="meta-timezone"
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Kolkata"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="meta-bio" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Bio / Profile Description
              </label>
              <textarea
                id="meta-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief professional bio or operational responsibilities..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              />
            </div>
          </div>

          {/* Dynamic Custom Key-Value Metadata Editor */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Custom Metadata Fields</h4>
                <p className="text-[11px] text-slate-400">
                  Add arbitrary key-value pairs (e.g. slack_id, qualification, blood_group).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMetadataField}
                className="text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 border-teal-200"
              >
                <Plus size={13} className="mr-1" />
                Add Field
              </Button>
            </div>

            {customMetadata.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                <p className="text-xs text-slate-500">No custom metadata fields yet.</p>
                <button
                  type="button"
                  onClick={handleAddMetadataField}
                  className="text-xs font-semibold text-teal-600 hover:underline mt-1"
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
                      className="w-1/3 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                    <input
                      type="text"
                      placeholder="Attribute Value (string or JSON)"
                      value={entry.value}
                      onChange={(e) => handleUpdateMetadataField(entry.id, 'value', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMetadataField(entry.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
              <label className="block text-xs font-mono text-slate-500 mb-1">Payload JSON Preview:</label>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify({ contactDetails: compiledContactDetails, metadata: compiledMetadata }, null, 2)}
              </pre>
            </div>
          )}
        </section>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={saving}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            <RotateCcw size={13} className="mr-1.5" />
            Reset to Saved
          </Button>

          <Button
            type="submit"
            disabled={saving}
            className="text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white min-w-[130px] shadow-sm"
          >
            {saving ? (
              'Saving Settings...'
            ) : (
              <>
                <Save size={14} className="mr-1.5" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
