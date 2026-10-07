'use client'

import { useState } from 'react'
import { Save, ToggleLeft, ToggleRight, Percent, Hash, AlertCircle, CheckCircle2, IndianRupee } from 'lucide-react'
import type { GstSettings } from '@/lib/types'
import { money } from '@/lib/formatters'
import { calculateGstForRupees } from '@/lib/money'
import { Card } from '@/components/ui/Card'
import { PillButton } from '@/components/ui/PillButton'
import { Tag } from '@/components/ui/Tag'

export function GstSettingsPage({
  settings,
  onSave,
  editable = true,
}: {
  settings: GstSettings | null
  onSave: (s: GstSettings) => Promise<void>
  editable?: boolean
}) {
  const [rate, setRate] = useState(settings ? String(settings.rate) : '')
  const [gstin, setGstin] = useState(settings?.gstin ?? '')
  const [enabled, setEnabled] = useState(settings?.enabled ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [previewMode, setPreviewMode] = useState<'exclusive' | 'inclusive'>('exclusive')

  const rateNum = Number(rate) || 0
  const halfRate = rateNum / 2
  const sampleFee = 10000

  // Exclusive computation
  const sampleExclusive = calculateGstForRupees(sampleFee, rateNum, false)
  const sampleGstExclusive = sampleExclusive.gstAmount
  const sampleTotalExclusive = sampleExclusive.totalAmount

  // Inclusive computation
  const sampleInclusive = calculateGstForRupees(sampleFee, rateNum, true)
  const sampleBaseInclusive = enabled ? sampleInclusive.taxableAmount : sampleFee
  const sampleGstInclusive = enabled ? sampleInclusive.gstAmount : 0
  const sampleHalfGstInclusive = enabled ? sampleInclusive.cgstAmount : 0

  const handleSave = async () => {
    const r = Number(rate)
    if (isNaN(r) || r < 0 || r > 100) {
      setError('GST rate must be between 0% and 100%.')
      return
    }
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      await onSave({ rate: r, gstin: gstin.trim() || null, enabled })
      setSuccess('GST settings saved successfully.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Tag variant="neutral">CONFIGURATION</Tag>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">GST Settings</h1>
          <p className="text-xs text-[var(--mute)] mt-1">
            Configure Goods & Services Tax rates, GSTIN, and tax computation for invoices.
          </p>
        </div>
      </div>

      {!settings && (
        <p className="p-3.5 rounded-2xl bg-[rgba(168,113,15,0.08)] border border-[rgba(168,113,15,0.25)] text-xs font-semibold text-[#a8710f]" role="status">
          GST settings have not been configured yet. Save this form to create them.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GST Configuration Card */}
        <Card className="p-6 space-y-5">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="text-base font-bold text-[var(--ink)]">Tax Configuration</h2>
            <p className="text-xs text-[var(--mute)] mt-0.5">Set your GST rate and registration number</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-[rgba(181,60,55,0.08)] border border-[rgba(181,60,55,0.25)] text-xs text-[#b53c37] flex items-center gap-2 font-medium">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3.5 rounded-2xl bg-[rgba(27,122,75,0.08)] border border-[rgba(27,122,75,0.25)] text-xs text-[#1b7a4b] flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Enable / Disable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
            <div>
              <p className="text-xs font-bold text-[var(--ink)]">GST Invoicing</p>
              <p className="text-[11px] text-[var(--mute)] mt-0.5">
                {enabled
                  ? 'GST will be calculated and shown on all invoices'
                  : 'Invoices will not include GST computation'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              disabled={!editable}
              className="text-[var(--mute)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              title={enabled ? 'Disable GST' : 'Enable GST'}
            >
              {enabled ? (
                <ToggleRight size={38} className="text-[var(--g1)]" />
              ) : (
                <ToggleLeft size={38} />
              )}
            </button>
          </div>

          {/* GST Rate */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              GST Rate (%) <span className="text-[#b53c37]">*</span>
            </label>
            <div className="relative">
              <Percent size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                disabled={!editable}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                placeholder="e.g. 18"
              />
            </div>
            {rateNum > 0 && (
              <p className="text-[11px] text-[var(--mute)] mt-1.5">
                CGST: {halfRate}% + SGST: {halfRate}% = {rateNum}% total
              </p>
            )}
          </div>

          {/* GSTIN */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">GSTIN</label>
            <div className="relative">
              <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                maxLength={15}
                disabled={!editable}
                className="w-full pl-9 pr-4 py-2.5 rounded-full text-xs text-[var(--ink)] font-mono tracking-wider bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                placeholder="Enter GSTIN"
              />
            </div>
            {!gstin.trim() && (
              <p className="mt-1.5 text-xs font-semibold text-[#a8710f]" role="status">
                GSTIN not configured
              </p>
            )}
            <p className="text-[11px] text-[var(--mute)] mt-1.5">15-character GST Identification Number</p>
          </div>

          {/* Save Button */}
          {editable && (
            <div className="pt-2 border-t border-[var(--border)]">
              <PillButton
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                className="w-full justify-center"
                icon={<Save size={15} />}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </PillButton>
            </div>
          )}
        </Card>

        {/* Live Preview Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Tax Breakdown Preview</h2>
              <p className="text-xs text-[var(--mute)] mt-0.5">How a ₹10,000 course fee is calculated under current settings</p>
            </div>
            <IndianRupee size={20} className="text-[var(--mute)]" />
          </div>

          {/* Mode Toggle Buttons */}
          <div className="flex gap-2 p-1 bg-[var(--panel)] rounded-full border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setPreviewMode('exclusive')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                previewMode === 'exclusive'
                  ? 'bg-[var(--card)] text-[var(--g1)] shadow-2xs'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
            >
              GST Exclusive Course
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('inclusive')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                previewMode === 'inclusive'
                  ? 'bg-[var(--card)] text-[var(--g1)] shadow-2xs'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
            >
              GST Inclusive Course
            </button>
          </div>

          <div className="rounded-[20px] border border-[var(--border)] overflow-hidden bg-[var(--card)]">
            {/* Header */}
            <div className="bg-[var(--panel)] border-b border-[var(--border)] px-5 py-3 flex items-center justify-between">
              <p className="text-xs font-bold tracking-wide uppercase text-[var(--ink)]">
                {previewMode === 'exclusive' ? 'GST Exclusive Breakdown' : 'GST Inclusive Breakdown'}
              </p>
              <Tag variant={previewMode === 'exclusive' ? 'warning' : 'success'}>
                {previewMode === 'exclusive' ? '+GST Added On Top' : 'GST Included In Price'}
              </Tag>
            </div>

            {/* Breakdown Rows */}
            <div className="divide-y divide-[var(--border-subtle)] text-xs">
              {previewMode === 'exclusive' ? (
                <>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-[var(--mute)]">Base Course Fee</span>
                    <span className="font-bold text-[var(--ink)]">{money(sampleFee)}</span>
                  </div>

                  {enabled && rateNum > 0 && (
                    <>
                      <div className="flex items-center justify-between px-5 py-2.5 bg-[var(--panel)]">
                        <span className="text-[var(--mute)]">CGST ({halfRate}%)</span>
                        <span className="font-medium text-[var(--ink)]">
                          {money(Math.round(sampleFee * (halfRate / 100)))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-5 py-2.5 bg-[var(--panel)]">
                        <span className="text-[var(--mute)]">SGST ({halfRate}%)</span>
                        <span className="font-medium text-[var(--ink)]">
                          {money(Math.round(sampleFee * (halfRate / 100)))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-5 py-2.5 bg-[rgba(27,122,75,0.06)]">
                        <span className="text-[#1b7a4b] font-medium">Total GST (+{rateNum}%)</span>
                        <span className="font-bold text-[#1b7a4b]">+{money(sampleGstExclusive)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between px-5 py-4 bg-[var(--panel)] border-t border-[var(--border)]">
                    <span className="font-bold text-[var(--ink)]">Total Payable</span>
                    <span className="text-sm font-extrabold text-[var(--g1)]">
                      {enabled ? money(sampleTotalExclusive) : money(sampleFee)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-[var(--mute)]">Base Tuition (Taxable Value)</span>
                    <span className="font-bold text-[var(--ink)]">{money(sampleBaseInclusive)}</span>
                  </div>

                  {enabled && rateNum > 0 && (
                    <>
                      <div className="flex items-center justify-between px-5 py-2.5 bg-[var(--panel)]">
                        <span className="text-[var(--mute)]">CGST ({halfRate}%)</span>
                        <span className="font-medium text-[var(--ink)]">{money(sampleHalfGstInclusive)}</span>
                      </div>
                      <div className="flex items-center justify-between px-5 py-2.5 bg-[var(--panel)]">
                        <span className="text-[var(--mute)]">SGST ({halfRate}%)</span>
                        <span className="font-medium text-[var(--ink)]">
                          {money(sampleGstInclusive - sampleHalfGstInclusive)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-5 py-2.5 bg-[rgba(27,122,75,0.06)]">
                        <span className="text-[#1b7a4b] font-medium">Included GST ({rateNum}%)</span>
                        <span className="font-bold text-[#1b7a4b]">{money(sampleGstInclusive)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between px-5 py-4 bg-[var(--panel)] border-t border-[var(--border)]">
                    <span className="font-bold text-[var(--ink)]">Total Payable (All-Inclusive)</span>
                    <span className="text-sm font-extrabold text-[var(--g1)]">{money(sampleFee)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="p-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--border)] text-xs text-[var(--mute)]">
            <p>
              {previewMode === 'exclusive' ? (
                <>
                  <strong className="text-[var(--ink)]">Exclusive Courses:</strong> GST is added on top of the course fee. Each student pays Base
                  Fee + {rateNum}% GST.
                </>
              ) : (
                <>
                  <strong className="text-[var(--ink)]">Inclusive Courses:</strong> The course price already contains {rateNum}% GST. Base taxable
                  revenue and tax are extracted automatically.
                </>
              )}
            </p>
          </div>

          {!enabled && (
            <div className="p-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--border)] text-xs text-[var(--mute)]">
              <p>
                GST is currently <strong>disabled</strong>. Invoices will show only the base course fee without tax
                computation.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
