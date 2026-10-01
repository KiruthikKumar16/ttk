'use client'

import { useState } from 'react'
import type { BrandSettings } from '@/lib/types'
import { Button } from '@/components/ui/button'
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

  const handleCopy = (key: string, text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
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
      <div className="page-heading">
        <div>
          <h1>Brand information</h1>
          <p className="subcopy">
            Configure core identity, official legal details, and public verification endpoints used across student
            invoices, completion certificates, and public portals.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl bg-red-50/90 border border-red-200 p-4 text-sm text-red-800 shadow-xs animate-in fade-in"
        >
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Unable to save changes</p>
            <p className="text-red-700 mt-0.5 text-xs">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl bg-emerald-50/90 border border-emerald-200 p-4 text-sm text-emerald-900 shadow-xs animate-in fade-in"
        >
          <div className="rounded-full bg-emerald-500 text-white p-1">
            <Check size={14} />
          </div>
          <div>
            <p className="font-semibold text-emerald-900">Brand information updated successfully</p>
            <p className="text-emerald-700 text-xs">
              All dynamic documents and public verification links reflect these updates immediately.
            </p>
          </div>
        </div>
      )}

      {editable ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Column: Organization & Brand Identity */}
            <div className="panel overflow-hidden border border-slate-200/70 shadow-xs bg-white/80 flex flex-col justify-between">
              <div>
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Organization & Brand Identity</h2>
                      <p className="text-xs text-slate-500">Public trade name, acronyms, and branding slogans</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Identity
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="displayName"
                        className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
                      >
                        Display Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                          id="displayName"
                          type="text"
                          required
                          value={formData.displayName}
                          onChange={(e) => handleChange('displayName', e.target.value)}
                          placeholder="ThoorigAI Infotech"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Primary academy title in navigation, portals, and headers
                      </p>
                    </div>

                    {/* Short Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="shortName"
                        className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
                      >
                        Short Name / Monogram <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Sparkles
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                          id="shortName"
                          type="text"
                          required
                          value={formData.shortName}
                          onChange={(e) => handleChange('shortName', e.target.value)}
                          placeholder="ThoorigAI"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Compact wordmark or acronym for mobile views & badges
                      </p>
                    </div>
                  </div>

                  {/* Legal Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="legalName"
                      className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
                    >
                      Legal Registered Entity <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <ShieldCheck
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="legalName"
                        type="text"
                        required
                        value={formData.legalName}
                        onChange={(e) => handleChange('legalName', e.target.value)}
                        placeholder="ThoorigAI Infotech LLP"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Formal company name printed on tax receipts, audit records, and certificates
                    </p>
                  </div>

                  {/* Tagline */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="tagline"
                      className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
                    >
                      Tagline / Motto
                    </label>
                    <div className="relative">
                      <FileText
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="tagline"
                        type="text"
                        value={formData.tagline}
                        onChange={(e) => handleChange('tagline', e.target.value)}
                        placeholder="Professional Learning & Training"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Printed underneath academy logo on invoices, diplomas, and official letters
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Billing Rules & Public Verification Portals */}
            <div className="space-y-6 flex flex-col justify-between">
              {/* Section 2: Invoicing & Communications */}
              <div className="panel overflow-hidden border border-slate-200/70 shadow-xs bg-white/80">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Billing & Invoicing Rules</h2>
                      <p className="text-xs text-slate-500">Invoice number generation & billing contact channels</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Billing
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Invoice Prefix */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="invoicePrefix"
                        className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
                      >
                        Invoice Prefix <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Hash
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                          id="invoicePrefix"
                          type="text"
                          required
                          value={formData.invoicePrefix}
                          onChange={(e) => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                          placeholder="TAI"
                          maxLength={8}
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white uppercase"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-slate-600 font-medium">Sample:</span>
                        <code className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {sampleInvoiceNum}
                        </code>
                      </div>
                    </div>

                    {/* Support Email */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="supportEmail"
                        className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
                      >
                        Support / Billing Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                          id="supportEmail"
                          type="email"
                          required
                          value={formData.supportEmail}
                          onChange={(e) => handleChange('supportEmail', e.target.value)}
                          placeholder="support@thoorigai.in"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600">Printed on student receipts for billing queries</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Web Portals & Verification */}
              <div className="panel overflow-hidden border border-slate-200/70 shadow-xs bg-white/80">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Public Endpoints & Verification</h2>
                      <p className="text-xs text-slate-500">
                        Official URLs for verification QR codes & academy website
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Portals
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Website URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="websiteUrl"
                        className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
                      >
                        Main Academy Website <span className="text-red-500">*</span>
                      </label>
                      {formData.websiteUrl && (
                        <a
                          href={formData.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <span>Visit site</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <Globe
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="websiteUrl"
                        type="url"
                        required
                        value={formData.websiteUrl}
                        onChange={(e) => handleChange('websiteUrl', e.target.value)}
                        placeholder="https://thoorigai.in"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Verification Site URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="verifyBaseUrl"
                        className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
                      >
                        Public Verification Portal URL <span className="text-red-500">*</span>
                      </label>
                      {formData.verifyBaseUrl && (
                        <a
                          href={formData.verifyBaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <span>Open portal</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <QrCode
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="verifyBaseUrl"
                        type="url"
                        required
                        value={formData.verifyBaseUrl}
                        onChange={(e) => handleChange('verifyBaseUrl', e.target.value)}
                        placeholder="https://ttk-lemon.vercel.app"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Action Bar */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
              />
              <span className="text-xs font-medium text-slate-600">
                {isDirty ? 'Unsaved changes pending' : 'All brand settings saved'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={saving}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <RotateCcw size={14} className="mr-1.5" />
                  Discard changes
                </Button>
              )}
              <Button
                type="submit"
                variant="default"
                disabled={saving || !isDirty}
                className="min-w-[130px] shadow-sm font-semibold"
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save size={15} className="mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        /* Non-Admin Read-Only View: Rich Specs in 2-Column Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Identity card */}
            <div className="panel overflow-hidden border border-slate-200 shadow-sm bg-white/90 p-6 flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xl shadow-md border border-indigo-500/20 shrink-0">
                  {formData.shortName.slice(0, 2).toUpperCase() || 'AI'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{formData.displayName}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formData.tagline || 'Professional Learning & Training'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Sparkles size={11} />
                      {formData.shortName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Check size={11} />
                      Active Institution
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                    Legal Registered Entity
                  </span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{formData.legalName}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                    Tagline / Mission
                  </span>
                  <span className="text-sm text-slate-600 mt-0.5 block">{formData.tagline || 'Not configured'}</span>
                </div>
              </div>
            </div>

            {/* Right: Technical Specs & Endpoints */}
            <div className="panel overflow-hidden border border-slate-200 shadow-sm bg-white/90 p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                    Invoice Prefix
                  </span>
                  <span className="text-sm font-mono font-bold text-indigo-700 mt-1 block">
                    {formData.invoicePrefix}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      Support Email
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('supportEmail', formData.supportEmail)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Copy email"
                    >
                      {copiedKey === 'supportEmail' ? (
                        <CheckCheck size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                  <span className="text-sm font-medium text-slate-900 mt-1 block truncate">
                    {formData.supportEmail}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Official Website
                  </span>
                  <a
                    href={formData.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Open website"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <span className="text-xs font-mono text-slate-700 mt-1 block truncate">{formData.websiteUrl}</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Public Verification Endpoint
                  </span>
                  <a
                    href={formData.verifyBaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Open verification portal"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <span className="text-xs font-mono text-slate-700 mt-1 block truncate">{formData.verifyBaseUrl}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-xs text-slate-500">
            <Lock size={14} className="text-slate-400 shrink-0" />
            <span>Only administrators have permission to modify brand identity and billing configuration.</span>
          </div>
        </div>
      )}
    </div>
  )
}
