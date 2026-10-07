'use client'

import { useState } from 'react'
import type { BrandSettings } from '@/lib/types'
import {
  Building2,
  Sparkles,
  ShieldCheck,
  FileText,
  Receipt,
  Hash,
  Mail,
  Globe,
  QrCode,
  ExternalLink,
  Save,
  RotateCcw,
  Check,
  Copy,
  CheckCheck,
  AlertCircle,
  Lock,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PillButton } from '@/components/ui/PillButton'
import { Tag } from '@/components/ui/Tag'

export function BrandSettingsClient({ settings, editable }: { settings: BrandSettings; editable: boolean }) {
  const [formData, setFormData] = useState<BrandSettings>(settings)
  const [initialData, setInitialData] = useState<BrandSettings>(settings)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData)

  const handleChange = (field: keyof BrandSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleReset = () => {
    setFormData(initialData)
    setError(null)
    setSuccess(false)
  }

  const handleCopy = async (key: string, text: string) => {
    if (!text) return
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
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to update brand settings')
      }

      if (data.data) {
        setFormData(data.data)
        setInitialData(data.data)
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const sampleInvoiceNum = `${(formData.invoicePrefix || 'TAI').trim()}/${currentYear}/INV1082`

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Tag variant="neutral">CONFIGURATION</Tag>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">Brand information</h1>
          <p className="text-xs text-[var(--mute)] mt-1">
            Configure core identity, official legal details, and public verification endpoints used across student
            invoices, completion certificates, and public portals.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl bg-[rgba(181,60,55,0.08)] border border-[rgba(181,60,55,0.25)] p-4 text-xs text-[#b53c37]"
        >
          <AlertCircle size={18} className="text-[#b53c37] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#b53c37]">Unable to save changes</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl bg-[rgba(27,122,75,0.08)] border border-[rgba(27,122,75,0.25)] p-4 text-xs text-[#1b7a4b]"
        >
          <div className="rounded-full bg-[#1b7a4b] text-white p-1">
            <Check size={14} />
          </div>
          <div>
            <p className="font-bold text-[#1b7a4b]">Brand information updated successfully</p>
            <p className="mt-0.5">
              All dynamic documents and public verification links reflect these updates immediately.
            </p>
          </div>
        </div>
      )}

      {editable ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Column: Organization & Brand Identity */}
            <Card className="p-0 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--panel)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--card)] text-[var(--g1)] border border-[var(--border)]">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[var(--ink)]">Organization & Brand Identity</h2>
                      <p className="text-xs text-[var(--mute)]">Public trade name, acronyms, and branding slogans</p>
                    </div>
                  </div>
                  <Tag variant="neutral">Identity</Tag>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="displayName"
                        className="block text-xs font-semibold tracking-wide text-[var(--ink)] uppercase"
                      >
                        Display Name <span className="text-[#b53c37]">*</span>
                      </label>
                      <div className="relative">
                        <Building2
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                        />
                        <input
                          id="displayName"
                          type="text"
                          required
                          value={formData.displayName}
                          onChange={(e) => handleChange('displayName', e.target.value)}
                          placeholder="ThoorigAI Infotech"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-[var(--mute)]">
                        Primary academy title in navigation, portals, and headers
                      </p>
                    </div>

                    {/* Short Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="shortName"
                        className="block text-xs font-semibold tracking-wide text-[var(--ink)] uppercase"
                      >
                        Short Name / Monogram <span className="text-[#b53c37]">*</span>
                      </label>
                      <div className="relative">
                        <Sparkles
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                        />
                        <input
                          id="shortName"
                          type="text"
                          required
                          value={formData.shortName}
                          onChange={(e) => handleChange('shortName', e.target.value)}
                          placeholder="ThoorigAI"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-[var(--mute)]">
                        Compact wordmark or acronym for mobile views & badges
                      </p>
                    </div>
                  </div>

                  {/* Legal Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="legalName"
                      className="block text-xs font-semibold tracking-wide text-[var(--ink)] uppercase"
                    >
                      Legal Registered Entity <span className="text-[#b53c37]">*</span>
                    </label>
                    <div className="relative">
                      <ShieldCheck
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                      />
                      <input
                        id="legalName"
                        type="text"
                        required
                        value={formData.legalName}
                        onChange={(e) => handleChange('legalName', e.target.value)}
                        placeholder="ThoorigAI Infotech LLP"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-full text-xs font-medium text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-[var(--mute)]">
                      Formal company name printed on tax receipts, audit records, and certificates
                    </p>
                  </div>

                  {/* Tagline */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="tagline"
                      className="block text-xs font-semibold tracking-wide text-[var(--ink)] uppercase"
                    >
                      Tagline / Motto
                    </label>
                    <div className="relative">
                      <FileText
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                      />
                      <input
                        id="tagline"
                        type="text"
                        value={formData.tagline}
                        onChange={(e) => handleChange('tagline', e.target.value)}
                        placeholder="Professional Learning & Training"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-[var(--mute)]">
                      Printed underneath academy logo on invoices, diplomas, and official letters
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Right Column: Billing Rules & Public Verification Portals */}
            <div className="space-y-6 flex flex-col justify-between">
              {/* Section 2: Invoicing & Communications */}
              <Card className="p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--panel)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--card)] text-[var(--g1)] border border-[var(--border)]">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[var(--ink)]">Billing & Invoicing Rules</h2>
                      <p className="text-xs text-[var(--mute)]">Invoice number generation & billing contact channels</p>
                    </div>
                  </div>
                  <Tag variant="neutral">Billing</Tag>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Invoice Prefix */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="invoicePrefix"
                        className="block text-xs font-semibold tracking-wide text-[var(--ink)] uppercase"
                      >
                        Invoice Prefix <span className="text-[#b53c37]">*</span>
                      </label>
                      <div className="relative">
                        <Hash
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                        />
                        <input
                          id="invoicePrefix"
                          type="text"
                          required
                          value={formData.invoicePrefix}
                          onChange={(e) => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                          placeholder="TAI"
                          maxLength={8}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-full text-xs font-mono font-bold uppercase text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-[var(--mute)] font-medium">Sample:</span>
                        <code className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--ink)] font-semibold">
                          {sampleInvoiceNum}
                        </code>
                      </div>
                    </div>

                    {/* Support Email */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="supportEmail"
                        className="block text-xs font-semibold tracking-wide text-[var(--ink)] uppercase"
                      >
                        Support / Billing Email <span className="text-[#b53c37]">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                        />
                        <input
                          id="supportEmail"
                          type="email"
                          required
                          value={formData.supportEmail}
                          onChange={(e) => handleChange('supportEmail', e.target.value)}
                          placeholder="support@thoorigai.in"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-[var(--mute)]">Printed on student receipts for billing queries</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Section 3: Web Portals & Verification */}
              <Card className="p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--panel)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--card)] text-[var(--g1)] border border-[var(--border)]">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[var(--ink)]">Public Endpoints & Verification</h2>
                      <p className="text-xs text-[var(--mute)]">
                        Official URLs for verification QR codes & academy website
                      </p>
                    </div>
                  </div>
                  <Tag variant="neutral">Portals</Tag>
                </div>

                <div className="p-6 space-y-4">
                  {/* Website URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="websiteUrl"
                        className="block text-xs font-semibold tracking-wide text-[var(--ink)] uppercase"
                      >
                        Main Academy Website <span className="text-[#b53c37]">*</span>
                      </label>
                      {formData.websiteUrl && (
                        <a
                          href={formData.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--g1)] hover:underline transition-colors"
                        >
                          <span>Visit site</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <Globe
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                      />
                      <input
                        id="websiteUrl"
                        type="url"
                        required
                        value={formData.websiteUrl}
                        onChange={(e) => handleChange('websiteUrl', e.target.value)}
                        placeholder="https://thoorigai.in"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-full text-xs font-mono text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Verification Site URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="verifyBaseUrl"
                        className="block text-xs font-semibold tracking-wide text-[var(--ink)] uppercase"
                      >
                        Public Verification Portal URL <span className="text-[#b53c37]">*</span>
                      </label>
                      {formData.verifyBaseUrl && (
                        <a
                          href={formData.verifyBaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--g1)] hover:underline transition-colors"
                        >
                          <span>Open portal</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <QrCode
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                      />
                      <input
                        id="verifyBaseUrl"
                        type="url"
                        required
                        value={formData.verifyBaseUrl}
                        onChange={(e) => handleChange('verifyBaseUrl', e.target.value)}
                        placeholder="https://ttk-lemon.vercel.app"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-full text-xs font-mono text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Full-width Action Bar */}
          <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-[#a8710f] animate-pulse' : 'bg-[#1b7a4b]'}`} />
              <span className="text-xs font-medium text-[var(--mute)]">
                {isDirty ? 'Unsaved changes pending' : 'All brand settings saved'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {isDirty && (
                <PillButton
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={saving}
                  icon={<RotateCcw size={14} />}
                >
                  Discard changes
                </PillButton>
              )}
              <PillButton type="submit" variant="primary" disabled={saving || !isDirty} icon={<Save size={15} />}>
                {saving ? 'Saving...' : 'Save Changes'}
              </PillButton>
            </div>
          </Card>
        </form>
      ) : (
        /* Non-Admin Read-Only View: Rich Specs in 2-Column Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Identity card */}
            <Card className="p-6 flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0"
                  style={{ background: 'var(--g-hero)' }}
                >
                  {formData.shortName.slice(0, 2).toUpperCase() || 'AI'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--ink)]">{formData.displayName}</h2>
                  <p className="text-xs text-[var(--mute)] mt-0.5">
                    {formData.tagline || 'Professional Learning & Training'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Tag variant="accent">
                      <Sparkles size={11} className="inline mr-1" />
                      {formData.shortName}
                    </Tag>
                    <Tag variant="success">
                      <Check size={11} className="inline mr-1" />
                      Active Institution
                    </Tag>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[var(--border)] space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider block">
                    Legal Registered Entity
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink)] mt-0.5 block">{formData.legalName}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider block">
                    Tagline / Mission
                  </span>
                  <span className="text-sm text-[var(--mute)] mt-0.5 block">
                    {formData.tagline || 'Not configured'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Right: Technical Specs & Endpoints */}
            <Card className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
                  <span className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider block">
                    Invoice Prefix
                  </span>
                  <span className="text-sm font-mono font-bold text-[var(--g1)] mt-1 block">
                    {formData.invoicePrefix}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider">
                      Support Email
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('supportEmail', formData.supportEmail)}
                      className="text-[var(--mute)] hover:text-[var(--g1)] transition-colors cursor-pointer"
                      title="Copy email"
                    >
                      {copiedKey === 'supportEmail' ? (
                        <CheckCheck size={14} className="text-[#1b7a4b]" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                  <span className="text-sm font-medium text-[var(--ink)] mt-1 block truncate">
                    {formData.supportEmail}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider">
                    Official Website
                  </span>
                  <a
                    href={formData.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--mute)] hover:text-[var(--g1)] transition-colors"
                    title="Open website"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <span className="text-xs font-mono text-[var(--ink)] mt-1 block truncate">{formData.websiteUrl}</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider">
                    Public Verification Endpoint
                  </span>
                  <a
                    href={formData.verifyBaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--mute)] hover:text-[var(--g1)] transition-colors"
                    title="Open verification portal"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <span className="text-xs font-mono text-[var(--ink)] mt-1 block truncate">
                  {formData.verifyBaseUrl}
                </span>
              </div>
            </Card>
          </div>

          <div className="px-6 py-3.5 bg-[var(--panel)] rounded-2xl border border-[var(--border)] flex items-center gap-2 text-xs text-[var(--mute)]">
            <Lock size={14} className="shrink-0" />
            <span>Only administrators have permission to modify brand identity and billing configuration.</span>
          </div>
        </div>
      )}
    </div>
  )
}
